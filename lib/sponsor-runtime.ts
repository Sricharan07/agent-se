import { buildAgentTimeline, getIssueSourcesFromStore, runGuildAgentTeam } from "@/agents";
import { syncSelectedSources } from "@/services/airbyte";
import { getClickHouseMetrics, resetClickHouse } from "@/services/clickhouse";
import { clusterSignals } from "@/services/dedup";
import { getTraceTimeline, resetLangfuse } from "@/services/langfuse";
import { readLocalState } from "@/services/local-state";
import { listSignals, listSyncMetadata, resetSignalStore } from "@/services/signal-store";
import type { CanonicalIssue, DashboardRuntime, IssueWorkspace } from "@/lib/types";

export function buildSponsorRuntime(): DashboardRuntime {
  const state = readLocalState();
  resetSignalStore();
  resetClickHouse();
  resetLangfuse();

  const syncResults = syncSelectedSources(state.onboarding.connectedSources);
  const signals = listSignals();
  const canonicalIssues = clusterSignals(signals, state);
  const guildRun = runGuildAgentTeam(signals, canonicalIssues, state);
  const metrics = getClickHouseMetrics();

  return {
    repo: state.onboarding.selectedRepo.replace(" / ", "/"),
    onboarding: state.onboarding,
    signals,
    syncResults,
    syncMetadata: listSyncMetadata(),
    canonicalIssues: guildRun.canonicalIssues,
    agentRuns: guildRun.agentRuns,
    agentSteps: guildRun.agentSteps,
    validationArtifacts: guildRun.validationArtifacts,
    pullRequestDrafts: guildRun.pullRequestDrafts,
    learnedProcedures: guildRun.learnedProcedures,
    agents: guildRun.agents.map((agent) => ({
      name: agent.name,
      status: agent.status(),
      logCount: agent.logs().length,
    })),
    metrics,
    timeline: buildAgentTimeline(guildRun.agentSteps),
  };
}

let sponsorRuntime: ReturnType<typeof buildSponsorRuntime> | undefined;

export function getSponsorRuntime() {
  sponsorRuntime ??= buildSponsorRuntime();
  return sponsorRuntime;
}

export function refreshSponsorRuntime() {
  sponsorRuntime = buildSponsorRuntime();
  return sponsorRuntime;
}

export function getWorkspaceForIssue(issueId: string): IssueWorkspace {
  const runtime = getSponsorRuntime();
  const issue =
    runtime.canonicalIssues.find((candidate) => candidate.id === issueId) ?? runtime.canonicalIssues[0];
  const run =
    runtime.agentRuns.find((candidate) => candidate.canonicalIssueId === issue.id) ?? runtime.agentRuns[0];

  return {
    issue,
    sources: getIssueSourcesFromStore(issue as CanonicalIssue),
    run,
    steps: runtime.agentSteps.filter((step) => step.agentRunId === run.id),
    artifacts: runtime.validationArtifacts.filter((artifact) => artifact.agentRunId === run.id),
    pr: runtime.pullRequestDrafts.find((draft) => draft.canonicalIssueId === issue.id),
    learnedProcedure:
      runtime.learnedProcedures.find((procedure) => procedure.canonicalIssueId === issue.id) ??
      runtime.learnedProcedures[0],
    traceTimeline: getTraceTimeline(run.id),
    agentTimeline: runtime.timeline.filter((entry) =>
      runtime.agentSteps.some((step) => step.id === entry.id && step.agentRunId === run.id),
    ),
  };
}
