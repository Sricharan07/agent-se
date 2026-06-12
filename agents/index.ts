import type {
  AgentRun,
  AgentStep,
  AgentTimelineEntry,
  CanonicalIssue,
  LearnedProcedure,
  LocalAppState,
  PullRequestDraft,
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
  canonicalIssues: CanonicalIssue[];
  runs: AgentRun[];
  steps: AgentStep[];
  tests: ValidationArtifact[];
  pullRequestDrafts: PullRequestDraft[];
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
    this.complete(context.steps.filter((step) => step.agent === this.name));
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
    context.canonicalIssues.forEach(insertCanonicalIssue);
    this.complete(context.steps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class TriageAgent extends GuildAgent {
  readonly name = "Triage Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    this.complete(context.steps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class InvestigationAgent extends GuildAgent {
  readonly name = "Investigation Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    this.complete(context.steps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class ValidationAgent extends GuildAgent {
  readonly name = "Validation Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    context.tests.forEach(insertTestResult);
    this.complete(context.steps.filter((step) => step.agent === this.name));
    return context;
  }
}

export class PRAgent extends GuildAgent {
  readonly name = "PR Agent";

  run(context: AgentContext): AgentContext {
    this.state = "running";
    context.pullRequestDrafts.forEach((draft) => createPullRequest(draft));
    this.complete(context.steps.filter((step) => step.agent === this.name));
    return context;
  }
}

function progressFor(runStatus: AgentRun["status"], issue: CanonicalIssue): AgentRun["progress"] {
  const labels = ["Ingest", "Deduplicate", "Analyze", "Investigate", "Plan", "Implement", "Validate", "PR"];
  const activeIndex =
    runStatus === "Complete"
      ? labels.length
      : issue.status === "New"
        ? 2
        : issue.status === "Triaged"
          ? 3
          : issue.status === "Investigating"
            ? 4
            : 6;

  return labels.map((label, index) => ({
    label,
    state: index < activeIndex ? "done" : index === activeIndex ? "active" : "queued",
  }));
}

function runStatusFor(issue: CanonicalIssue, state: LocalAppState): AgentRun["status"] {
  const override = state.issueState[issue.id]?.runStatus;
  if (override) return override;
  if (issue.status === "Draft PR" || issue.status === "Validated") return "Complete";
  if (issue.status === "Investigating") return "Running";
  return "Queued";
}

function createRun(issue: CanonicalIssue, state: LocalAppState): AgentRun {
  const runStatus = runStatusFor(issue, state);
  const startedAt = state.issueState[issue.id]?.assignedAt ?? issue.updatedAt;
  const endedAt = runStatus === "Complete" ? new Date(Date.parse(startedAt) + 35 * 60 * 1000).toISOString() : undefined;

  return {
    id: `run-${issue.id.toLowerCase()}`,
    canonicalIssueId: issue.id,
    status: runStatus,
    startedAt,
    endedAt,
    outcome: outcomeFor(issue, runStatus),
    modelVersion: "ase-agent-2026-06",
    traceId: `lf-trace-${issue.id.toLowerCase()}`,
    progress: progressFor(runStatus, issue),
  };
}

function outcomeFor(issue: CanonicalIssue, runStatus: AgentRun["status"]) {
  if (runStatus === "Complete") {
    return issue.status === "Draft PR"
      ? "Draft PR opened with validation evidence attached for maintainer review."
      : "Run completed and validation evidence was captured.";
  }

  if (runStatus === "Running") {
    return "Root cause is being investigated with source signals, repo context, and test evidence.";
  }

  if (issue.status === "New") return "Queued after deduplication; waiting for priority scheduling.";
  return "Triage completed; agent needs more reproduction data before implementation.";
}

function step(
  issue: CanonicalIssue,
  run: AgentRun,
  index: number,
  agent: string,
  action: string,
  tool: string,
  inputSummary: string,
  outputSummary: string,
  confidence: number,
  durationMs: number,
): AgentStep {
  const timestamp = new Date(Date.parse(run.startedAt) + index * 7000).toISOString().slice(11, 19);

  return {
    id: `${run.id}-step-${index}`,
    agentRunId: run.id,
    timestamp,
    agent,
    action,
    tool,
    inputSummary,
    outputSummary,
    confidence,
    durationMs,
  };
}

function createSteps(issue: CanonicalIssue, run: AgentRun): AgentStep[] {
  const baseSteps = [
    step(
      issue,
      run,
      1,
      "Intake Agent",
      "Started investigation",
      "Guild.ai orchestration",
      `${issue.id} with ${issue.signalIds.length} linked source signals.`,
      `Created ${run.status.toLowerCase()} run and assigned ${issue.affectedArea} workspace.`,
      Math.min(0.96, issue.confidence),
      420,
    ),
    step(
      issue,
      run,
      2,
      "Dedup Agent",
      "Deduplicated signals",
      "Cluster scorer",
      "Repository, module, symptom tokens, source overlap, and report window.",
      `Merged ${issue.signalIds.length} signal${issue.signalIds.length === 1 ? "" : "s"} into ${issue.id}.`,
      issue.confidence,
      1300,
    ),
    step(
      issue,
      run,
      3,
      "Triage Agent",
      "Classified canonical issue",
      "Priority classifier",
      `${issue.issueType}, ${issue.affectedArea}, ${issue.priority} priority.`,
      `Status set to ${issue.status}; confidence ${Math.round(issue.confidence * 100)}%.`,
      Math.max(0.72, issue.confidence - 0.03),
      980,
    ),
  ];

  if (run.status === "Queued") return baseSteps;

  const investigationSteps = [
    step(
      issue,
      run,
      4,
      "Investigation Agent",
      "Searched repository context",
      "Composio GitHub code search",
      `${issue.affectedArea}, ${issue.title}, linked source summaries.`,
      repositoryFindingFor(issue),
      Math.max(0.78, issue.confidence - 0.06),
      3100,
    ),
    step(
      issue,
      run,
      5,
      "Investigation Agent",
      "Replayed evidence",
      "ClickHouse event replay",
      `Recent events for ${issue.repo} and affected area ${issue.affectedArea}.`,
      evidenceFindingFor(issue),
      Math.max(0.77, issue.confidence - 0.04),
      7420,
    ),
    step(
      issue,
      run,
      6,
      "Investigation Agent",
      "Identified likely root cause",
      "Langfuse trace analysis",
      "Trace spans, source cluster, and tool outputs.",
      rootCauseFor(issue),
      Math.max(0.76, issue.confidence - 0.05),
      2120,
    ),
    step(
      issue,
      run,
      7,
      "Triage Agent",
      "Generated fix plan",
      "Investigation agent",
      "Root cause, relevant files, and regression risk.",
      fixPlanFor(issue),
      Math.max(0.74, issue.confidence - 0.08),
      1560,
    ),
    step(
      issue,
      run,
      8,
      "Validation Agent",
      "Prepared validation",
      "Test agent",
      "Candidate fix, fixture requirements, and expected behavior.",
      validationPlanFor(issue),
      Math.max(0.73, issue.confidence - 0.1),
      2380,
    ),
  ];

  const prStep =
    run.status === "Complete"
      ? [
          step(
            issue,
            run,
            9,
            "PR Agent",
            "Prepared draft PR",
            "Composio GitHub PR action",
            "Diff summary, test evidence, linked signals, and maintainer review checklist.",
            "Draft PR payload created and evidence attached for review.",
            Math.max(0.75, issue.confidence - 0.07),
            1800,
          ),
        ]
      : [];

  return [...baseSteps, ...investigationSteps, ...prStep];
}

function repositoryFindingFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "Found relevant files in api/search and services/query; query fan-out path is hot.";
  if (issue.id === "SE-1025") return "Found search filter controls and result export code paths in search-ui.";
  if (issue.id === "SE-1026") return "Found ranking weights and exact-match boost logic in ranking pipeline.";
  if (issue.id === "SE-1027") return "Found index refresh guard missing around nightly import snapshot replacement.";
  return `Found likely owner files for ${issue.affectedArea}.`;
}

function evidenceFindingFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "Replay reproduced slow path; large dataset query count exceeds threshold.";
  if (issue.id === "SE-1025") return "Usage events show exports after broad search queries; users need narrowing controls.";
  if (issue.id === "SE-1026") return "Evaluation traces show exact matches scoring below fuzzy matches for several queries.";
  if (issue.id === "SE-1027") return "Import failure replay leaves stale snapshot active after refresh error.";
  return "Event replay captured enough evidence for next-step planning.";
}

function rootCauseFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "N+1 facet hydration in SearchService.getResults causes 3x slower response on large datasets.";
  if (issue.id === "SE-1025") return "Search UI lacks date range parameters in query state and export request payload.";
  if (issue.id === "SE-1026") return "Exact-match boost is applied after normalization, reducing its effect for short queries.";
  if (issue.id === "SE-1027") return "Refresh job replaces snapshot before verifying imported index health.";
  return "Root cause candidate recorded for maintainer review.";
}

function fixPlanFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "Plan: batch facet hydration, add large-dataset regression, update trace assertions.";
  if (issue.id === "SE-1025") return "Plan: add date range state, API parameters, and export coverage.";
  if (issue.id === "SE-1026") return "Plan: move exact-match boost before normalization and add ranking snapshots.";
  if (issue.id === "SE-1027") return "Plan: preserve last-good snapshot until refresh health checks pass.";
  return "Plan: prepare targeted patch and regression coverage.";
}

function validationPlanFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "Prepared SearchService.large-dataset.spec.ts with query-count assertion.";
  if (issue.id === "SE-1025") return "Prepared search filter component and export request tests.";
  if (issue.id === "SE-1026") return "Prepared ranking snapshot tests for exact-match scenarios.";
  if (issue.id === "SE-1027") return "Prepared import refresh regression test with failing index fixture.";
  return "Prepared regression test plan.";
}

function createValidationArtifacts(issue: CanonicalIssue, run: AgentRun): ValidationArtifact[] {
  const pathPrefix = issue.affectedArea.replaceAll("-", "/");
  const staged = run.status !== "Complete";

  return [
    {
      id: `${issue.id}-unit`,
      agentRunId: run.id,
      artifactType: "Unit Test",
      path: `${pathPrefix}/${issue.id.toLowerCase()}.unit.spec.ts`,
      summary: validationPlanFor(issue),
      passed: true,
    },
    {
      id: `${issue.id}-trace`,
      agentRunId: run.id,
      artifactType: "Trace",
      path: `artifacts/${run.traceId}.json`,
      summary: evidenceFindingFor(issue),
      passed: true,
    },
    {
      id: `${issue.id}-integration`,
      agentRunId: run.id,
      artifactType: "Integration Test",
      path: `tests/${issue.id.toLowerCase()}.integration.ts`,
      summary: staged ? "Integration validation is staged and waiting for final patch application." : "Integration validation passed in local agent sandbox.",
      passed: !staged,
    },
  ];
}

function createPullRequestDraft(issue: CanonicalIssue, run: AgentRun, state: LocalAppState): PullRequestDraft | undefined {
  if (issue.status !== "Draft PR" && issue.id !== "SE-1024") return undefined;

  return {
    id: `pr-${issue.id.toLowerCase()}`,
    canonicalIssueId: issue.id,
    agentRunId: run.id,
    prUrl: `https://github.com/${issue.repo}/pull/${issue.id.replace("SE-", "")}`,
    status: state.issueState[issue.id]?.prStatus ?? (issue.status === "Draft PR" ? "Ready for review" : "Draft"),
    diffSummary: diffSummaryFor(issue),
    createdAt: state.issueState[issue.id]?.lastActionAt ?? new Date(Date.parse(issue.updatedAt) + 18 * 60 * 1000).toISOString(),
  };
}

function diffSummaryFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") {
    return "Batch facet hydration in SearchService, add query-count regression coverage, and attach trace evidence to the PR body.";
  }
  if (issue.id === "SE-1025") return "Add date range filters to search state, query params, and export requests.";
  if (issue.id === "SE-1026") return "Adjust exact-match ranking boost and add regression snapshots.";
  if (issue.id === "SE-1027") {
    return "Guard refresh failures, preserve last good index snapshot, and add stale-record import regression tests.";
  }
  return "Targeted patch, validation evidence, and maintainer review checklist.";
}

function createLearnedProcedures(issues: CanonicalIssue[]): LearnedProcedure[] {
  return issues.map((issue) => ({
    id: `learn-${issue.id.toLowerCase()}`,
    repo: issue.repo,
    canonicalIssueId: issue.id,
    patternName: learnedPatternFor(issue),
    procedureSummary: learnedSummaryFor(issue),
    successCount: issue.status === "Draft PR" || issue.status === "Validated" ? 4 : 1,
    lastVerifiedAt: issue.updatedAt,
  }));
}

function learnedPatternFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") return "Large dataset performance regression";
  if (issue.id === "SE-1025") return "Search UX feature request synthesis";
  if (issue.id === "SE-1026") return "Ranking regression triage";
  if (issue.id === "SE-1027") return "Safe index refresh recovery";
  return `${issue.affectedArea} investigation procedure`;
}

function learnedSummaryFor(issue: CanonicalIssue) {
  if (issue.id === "SE-1024") {
    return "Cluster reports by module and dataset size, replay ClickHouse traces, inspect query fan-out, then add query-count regression tests.";
  }
  if (issue.id === "SE-1025") {
    return "Merge docs and discussion feedback into one feature issue, validate query-state impact, then test export payload behavior.";
  }
  if (issue.id === "SE-1026") {
    return "Keep low-confidence ranking clusters in triage until reproduction data and ranking snapshots are available.";
  }
  if (issue.id === "SE-1027") {
    return "Before replacing an index snapshot, validate refresh health and retain the previous good snapshot as rollback evidence.";
  }
  return "Reuse source clustering, owner-file search, trace replay, and regression tests for similar future work.";
}

export function runGuildAgentTeam(signals: Signal[], canonicalIssues: CanonicalIssue[], state: LocalAppState) {
  const runs = canonicalIssues.map((issue) => createRun(issue, state));
  const steps = canonicalIssues.flatMap((issue) => {
    const run = runs.find((candidate) => candidate.canonicalIssueId === issue.id);
    return run ? createSteps(issue, run) : [];
  });
  const validationArtifacts = canonicalIssues.flatMap((issue) => {
    const run = runs.find((candidate) => candidate.canonicalIssueId === issue.id);
    if (!run || run.status === "Queued") return [];
    return createValidationArtifacts(issue, run);
  });
  const pullRequestDrafts = canonicalIssues
    .map((issue) => {
      const run = runs.find((candidate) => candidate.canonicalIssueId === issue.id);
      return run ? createPullRequestDraft(issue, run, state) : undefined;
    })
    .filter((draft): draft is PullRequestDraft => Boolean(draft));
  const learnedProcedures = createLearnedProcedures(canonicalIssues);

  const agents = [
    new IntakeAgent(),
    new DedupAgent(),
    new TriageAgent(),
    new InvestigationAgent(),
    new ValidationAgent(),
    new PRAgent(),
  ];
  let context: AgentContext = {
    signals,
    canonicalIssues,
    runs,
    steps,
    tests: validationArtifacts,
    pullRequestDrafts,
  };

  for (const agent of agents) {
    context = agent.run(context);
  }

  runs.forEach((run) => {
    insertAgentRun(run);
    const trace = startTrace({
      id: run.traceId,
      agentRunId: run.id,
      name: `Guild run for ${run.canonicalIssueId}`,
      startedAt: run.startedAt,
    });

    steps
      .filter((agentStep) => agentStep.agentRunId === run.id)
      .forEach((agentStep) => {
        insertAgentStep(agentStep);
        const span = createSpan(trace.id, agentStep);
        finishSpan(span.id);
        recordEvaluation(span.id, {
          name: `${agentStep.agent ?? "Agent"} confidence`,
          score: agentStep.confidence,
          verdict: agentStep.confidence >= 0.82 ? "pass" : "review",
        });
      });
    finishTrace(trace.id);
  });

  return {
    agents,
    canonicalIssues: context.canonicalIssues,
    agentRuns: context.runs,
    agentSteps: context.steps,
    validationArtifacts: context.tests,
    pullRequestDrafts: context.pullRequestDrafts,
    learnedProcedures,
  };
}

export function buildAgentTimeline(steps: AgentStep[]): AgentTimelineEntry[] {
  return steps.map((agentStep) => ({
    id: agentStep.id,
    timestamp: agentStep.timestamp,
    agent: agentStep.agent ?? "Guild Agent",
    action: agentStep.action,
    tool: agentStep.tool,
    durationMs: agentStep.durationMs,
    confidence: agentStep.confidence,
  }));
}

export function getIssueSourcesFromStore(issue: CanonicalIssue) {
  return getSignalsByIds(issue.signalIds);
}
