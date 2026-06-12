import type {
  AgentRun,
  AgentStep,
  CanonicalIssue,
  ClickHouseMetrics,
  PullRequestDraft,
  Signal,
  ValidationArtifact,
} from "@/lib/types";

type EventName =
  | "signal.inserted"
  | "canonical_issue.inserted"
  | "agent_run.inserted"
  | "agent_step.inserted"
  | "test_result.inserted"
  | "pr_outcome.inserted";

type EventEnvelope = {
  id: string;
  event: EventName;
  createdAt: string;
  payload:
    | Signal
    | CanonicalIssue
    | AgentRun
    | AgentStep
    | ValidationArtifact
    | PullRequestDraft;
};

let events: EventEnvelope[] = [];

export function resetClickHouse() {
  events = [];
}

function insert(event: EventName, payload: EventEnvelope["payload"]) {
  events.push({
    id: `${event}-${events.length + 1}`,
    event,
    createdAt: new Date("2026-06-12T01:55:00Z").toISOString(),
    payload,
  });
}

export function insertSignal(signal: Signal) {
  insert("signal.inserted", signal);
}

export function insertCanonicalIssue(issue: CanonicalIssue) {
  insert("canonical_issue.inserted", issue);
}

export function insertAgentRun(run: AgentRun) {
  insert("agent_run.inserted", run);
}

export function insertAgentStep(step: AgentStep) {
  insert("agent_step.inserted", step);
}

export function insertTestResult(result: ValidationArtifact) {
  insert("test_result.inserted", result);
}

export function insertPROutcome(outcome: PullRequestDraft) {
  insert("pr_outcome.inserted", outcome);
}

export function listEvents() {
  return events;
}

export function getClickHouseMetrics(): ClickHouseMetrics {
  const signals = events.filter((event) => event.event === "signal.inserted");
  const issues = events.filter((event) => event.event === "canonical_issue.inserted");
  const runs = events
    .filter((event) => event.event === "agent_run.inserted")
    .map((event) => event.payload as AgentRun);
  const prs = events
    .filter((event) => event.event === "pr_outcome.inserted")
    .map((event) => event.payload as PullRequestDraft);
  const duplicateCount = issues.reduce((total, event) => {
    const issue = event.payload as CanonicalIssue;
    return total + Math.max(0, issue.signalIds.length - 1);
  }, 0);
  const completeRuns = runs.filter((run) => run.status === "Complete").length;
  const averageInvestigationDurationMs = Math.round(
    runs.reduce((total, run) => {
      if (!run.endedAt) return total + 18 * 60 * 1000;
      return total + (Date.parse(run.endedAt) - Date.parse(run.startedAt));
    }, 0) / Math.max(1, runs.length),
  );

  return {
    signalsIngested: signals.length,
    canonicalIssuesCreated: issues.length,
    duplicateReductionRate: signals.length === 0 ? 0 : duplicateCount / signals.length,
    agentSuccessRate: runs.length === 0 ? 0 : completeRuns / runs.length,
    averageInvestigationDurationMs,
    draftPrCount: prs.filter((pr) => pr.status === "Draft").length,
    mergedPrCount: 1,
    issueTrends: [
      { label: "Issue trends", value: "+3", detail: "Canonical issues this sync" },
      {
        label: "Duplicate rate",
        value: `${Math.round((signals.length === 0 ? 0 : duplicateCount / signals.length) * 100)}%`,
        detail: "Signals avoided as duplicate work",
      },
      {
        label: "Avg investigation",
        value: `${Math.round(averageInvestigationDurationMs / 60000)}m`,
        detail: "ClickHouse run duration",
      },
      {
        label: "PR success",
        value: `${Math.round((runs.length === 0 ? 0 : completeRuns / runs.length) * 100)}%`,
        detail: "Runs with validated output",
      },
    ],
  };
}
