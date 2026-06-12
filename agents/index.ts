import {
  agentRuns as seedRuns,
  agentSteps as seedSteps,
  canonicalIssues as seedIssues,
  learnedProcedures,
  pullRequestDrafts,
  validationArtifacts,
} from "@/lib/mock-data";
import type {
  AgentRun,
  AgentStep,
  AgentTimelineEntry,
  CanonicalIssue,
  Signal,
  ValidationArtifact,
} from "@/lib/types";
import {
  insertAgentRun,
  insertAgentStep,
  insertCanonicalIssue,
  insertTestResult,
} from "@/services/clickhouse";
import { createPullRequest } from "@/services/composio";
import { createSpan, finishSpan, finishTrace, recordEvaluation, startTrace } from "@/services/langfuse";
import { getSignalsByIds } from "@/services/signal-store";

type AgentState = "idle" | "running" | "complete";
type AgentContext = {
  signals: Signal[];
  canonicalIssues?: CanonicalIssue[];
  runs?: AgentRun[];
  steps?: AgentStep[];
  tests?: ValidationArtifact[];
};

abstract class GuildAgent {
  protected state: AgentState = "idle";
  protected entries: AgentStep[] = [];

  abstract readonly name: string;
  abstract run(context: AgentContext): AgentContext;

  status() {
    return this.state;
  }

  logs() {
    return this.entries;
  }

  protected complete(entries: AgentStep[]) {
    this.state = "complete";
    this.entries = entries;
  }
}

export class IntakeAgent extends GuildAgent {
  readonly name = "Intake Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    this.complete(seedSteps.filter((step) => step.agent === this.name));
    return {
      ...context,
      signals: context.signals.filter((signal) => signal.id && signal.text && signal.repo),
    };
  }
}

export class DedupAgent extends GuildAgent {
  readonly name = "Dedup Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    const signalIds = new Set(context.signals.map((signal) => signal.id));
    const canonicalIssues = seedIssues
      .map((issue) => ({
        ...issue,
        signalIds: issue.signalIds.filter((id) => signalIds.has(id)),
      }))
      .filter((issue) => issue.signalIds.length > 0);

    canonicalIssues.forEach(insertCanonicalIssue);
    this.complete(seedSteps.filter((step) => step.agent === this.name));

    return { ...context, canonicalIssues };
  }
}

export class TriageAgent extends GuildAgent {
  readonly name = "Triage Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    this.complete(seedSteps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class InvestigationAgent extends GuildAgent {
  readonly name = "Investigation Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    this.complete(seedSteps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class ValidationAgent extends GuildAgent {
  readonly name = "Validation Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    validationArtifacts.forEach(insertTestResult);
    this.complete(seedSteps.filter((step) => step.agent === this.name));
    return { ...context, tests: validationArtifacts };
  }
}

export class PRAgent extends GuildAgent {
  readonly name = "PR Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    pullRequestDrafts.forEach((draft) => createPullRequest(draft));
    this.complete([]);
    return context;
  }
}

export function runGuildAgentTeam(signals: Signal[]) {
  const agents = [
    new IntakeAgent(),
    new DedupAgent(),
    new TriageAgent(),
    new InvestigationAgent(),
    new ValidationAgent(),
    new PRAgent(),
  ];
  let context: AgentContext = { signals };

  for (const agent of agents) {
    context = agent.run(context);
  }

  const runs = seedRuns.filter((run) =>
    (context.canonicalIssues ?? []).some((issue) => issue.id === run.canonicalIssueId),
  );
  const steps = seedSteps.filter((step) => runs.some((run) => run.id === step.agentRunId));

  runs.forEach((run) => {
    insertAgentRun(run);
    const trace = startTrace({
      id: run.traceId,
      agentRunId: run.id,
      name: `Guild run for ${run.canonicalIssueId}`,
      startedAt: run.startedAt,
    });
    steps
      .filter((step) => step.agentRunId === run.id)
      .forEach((step) => {
        insertAgentStep(step);
        const span = createSpan(trace.id, step);
        finishSpan(span.id);
        recordEvaluation(span.id, {
          name: `${step.agent ?? "Agent"} confidence`,
          score: step.confidence,
          verdict: step.confidence >= 0.82 ? "pass" : "review",
        });
      });
    finishTrace(trace.id);
  });

  return {
    agents,
    canonicalIssues: context.canonicalIssues ?? [],
    agentRuns: runs,
    agentSteps: steps,
    validationArtifacts,
    pullRequestDrafts,
    learnedProcedures,
  };
}

export function buildAgentTimeline(steps: AgentStep[]): AgentTimelineEntry[] {
  return steps.map((step) => ({
    id: step.id,
    timestamp: step.timestamp,
    agent: step.agent ?? "Guild Agent",
    action: step.action,
    tool: step.tool,
    durationMs: step.durationMs,
    confidence: step.confidence,
  }));
}

export function getIssueSourcesFromStore(issue: CanonicalIssue) {
  return getSignalsByIds(issue.signalIds);
}
