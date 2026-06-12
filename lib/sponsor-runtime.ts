import { buildAgentTimeline, getIssueSourcesFromStore, runGuildAgentTeam } from "@/agents";
import { syncGithubDiscussions, syncGithubIssues, syncSlackSignals } from "@/services/airbyte";
import { getClickHouseMetrics, resetClickHouse } from "@/services/clickhouse";
import { getTraceTimeline, resetLangfuse } from "@/services/langfuse";
import { listSignals, listSyncMetadata, resetSignalStore } from "@/services/signal-store";
import type { CanonicalIssue } from "@/lib/types";

export function buildSponsorRuntime() {
  resetSignalStore();
  resetClickHouse();
  resetLangfuse();

  const syncResults = [syncGithubIssues(), syncGithubDiscussions(), syncSlackSignals()];
  const signals = listSignals();
  const guildRun = runGuildAgentTeam(signals);
  const metrics = getClickHouseMetrics();

  return {
    repo: "acme/search-service",
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

export function getWorkspaceForIssue(issueId: string) {
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
    learnedProcedure: runtime.learnedProcedures[0],
    traceTimeline: getTraceTimeline(run.id),
    agentTimeline: runtime.timeline.filter((entry) =>
      runtime.agentSteps.some((step) => step.id === entry.id && step.agentRunId === run.id),
    ),
  };
}
