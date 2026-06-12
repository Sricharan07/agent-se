"use client";

import { ExternalLink, GitMerge, ShieldCheck } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { AgentTimelinePanel } from "@/components/dashboard/agent-timeline-panel";
import { AgentLogTimeline } from "@/components/dashboard/agent-log-timeline";
import { publishDraftPr, startAgentRun, useIssueWorkspace } from "@/components/dashboard/data-client";
import { SourceIcon } from "@/components/dashboard/source-icon";
import { PrDraftCard } from "@/components/dashboard/pr-draft-card";
import { TestResultsCard } from "@/components/dashboard/test-results-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IssueDetailWorkspace({ issueId }: { issueId: string }) {
  const queryClient = useQueryClient();
  const { data, isError, isLoading } = useIssueWorkspace(issueId);
  const runMutation = useMutation({
    mutationFn: () => startAgentRun(issueId),
    onSuccess: (workspace) => {
      queryClient.setQueryData(["ase-workspace", issueId], workspace);
      queryClient.invalidateQueries({ queryKey: ["ase-dashboard"] });
    },
  });
  const prMutation = useMutation({
    mutationFn: () => publishDraftPr(issueId),
    onSuccess: (workspace) => {
      queryClient.setQueryData(["ase-workspace", issueId], workspace);
      queryClient.invalidateQueries({ queryKey: ["ase-dashboard"] });
    },
  });

  if (isLoading || !data) {
    return (
      <div className="grid min-h-[420px] place-items-center text-sm text-muted-foreground">
        Loading issue workspace...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="m-5 rounded-lg border border-border p-6 text-sm text-muted-foreground">
        Could not load this workspace. Try syncing again.
      </div>
    );
  }

  const {
    issue,
    sources,
    run,
    steps,
    artifacts,
    pr,
    learnedProcedure,
    traceTimeline,
    agentTimeline,
  } = data;

  return (
    <div className="flex flex-col">
      <section className="border-b border-border p-5">
        <div className="flex flex-col gap-5 2xl:flex-row 2xl:items-start 2xl:justify-between">
          <div className="min-w-0 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Issue</span>
              <span>•</span>
              <span>{issue.id}</span>
              <Badge tone="muted">{issue.status}</Badge>
            </div>
            <h2 className="mt-4 text-2xl font-semibold leading-8 tracking-normal">{issue.title}</h2>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge tone="warning">{issue.priority}</Badge>
              <span>{issue.affectedArea}</span>
              <span>•</span>
              <span>{Math.round(issue.confidence * 100)}% cluster confidence</span>
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-muted-foreground">{issue.summary}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant={run.status === "Running" ? "outline" : "default"}
                size="sm"
                onClick={() => runMutation.mutate()}
                disabled={runMutation.isPending || run.status === "Running"}
              >
                {run.status === "Running"
                  ? "Agent running"
                  : runMutation.isPending
                    ? "Starting..."
                    : "Start agent run"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => prMutation.mutate()}
                disabled={prMutation.isPending || issue.status === "Draft PR"}
              >
                {issue.status === "Draft PR" ? "Draft PR created" : prMutation.isPending ? "Publishing..." : "Create draft PR"}
              </Button>
            </div>
          </div>

          <div className="w-full rounded-lg border border-border p-4 2xl:max-w-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Sources ({sources.length})</h3>
              <GitMerge className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="mt-4 grid gap-3">
              {sources.map((source) => (
                <div key={source.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className="flex min-w-0 items-center gap-2">
                    <SourceIcon source={source.source} className="h-4 w-4 shrink-0" />
                    <span className="truncate">{source.sourceRef}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{source.type}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
              {issue.mergeReason}
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border px-5 py-6">
        <h3 className="text-sm font-semibold">Investigation Progress</h3>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 xl:grid-cols-8">
          {run.progress.map((step, index) => (
            <div key={step.label} className="min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs font-semibold",
                    step.state === "done" && "border-black bg-white text-black",
                    step.state === "active" && "border-black bg-black text-white",
                    step.state === "queued" && "border-border bg-white text-muted-foreground",
                  )}
                >
                  {index + 1}
                </span>
                <span className="truncate text-xs text-muted-foreground">{step.label}</span>
              </div>
              <div className="mt-3 h-px bg-border" />
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 p-5 2xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0">
          <div className="mb-5">
            <AgentTimelinePanel entries={agentTimeline} />
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span>{traceTimeline.spans.length} trace spans</span>
              <span>{traceTimeline.toolCalls.length} tool calls</span>
              <span>{traceTimeline.evaluations.length} evaluations</span>
            </div>
          </div>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Detailed Agent Logs</h3>
            <Badge tone="accent">Trace {run.traceId}</Badge>
          </div>
          <AgentLogTimeline steps={steps} />
        </div>

        <div className="grid content-start gap-5">
          <section className="rounded-lg border border-border">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Proposed Change</h3>
            </div>
            <div className="p-4">
              <p className="text-sm leading-6 text-muted-foreground">
                {pr?.diffSummary ?? proposedChangeFor(issue.id)}
              </p>
            </div>
          </section>

          <TestResultsCard artifacts={artifacts} />
          <PrDraftCard draft={pr} />

          <section className="rounded-lg border border-border">
            <div className="border-b border-border px-4 py-3">
              <h3 className="text-sm font-semibold">Learning</h3>
            </div>
            <div className="p-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
                <div>
                  <div className="text-sm font-medium">
                    {learnedProcedure?.patternName ?? "No learned procedure yet"}
                  </div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {learnedProcedure?.procedureSummary ??
                      "The learning layer will store reusable procedures after this run has enough validation evidence."}
                  </p>
                  <Button className="mt-4" variant="outline" size="sm">
                    View procedure
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function proposedChangeFor(issueId: string) {
  if (issueId === "SE-1024") {
    return "Batch facet hydration in SearchService.getResults, reuse the existing large-index fixture, and enforce query-count limits before publishing the draft PR.";
  }
  if (issueId === "SE-1025") {
    return "Add date range state to the search UI, send the selected range to the search API, and include it in export requests.";
  }
  if (issueId === "SE-1026") {
    return "Move exact-match boost earlier in the ranking pipeline and add snapshot coverage for short exact queries.";
  }
  if (issueId === "SE-1027") {
    return "Preserve the last good index snapshot until the refresh job passes health checks, then update stale-record regression coverage.";
  }
  return "Prepare a targeted patch, regression test, and draft PR evidence bundle for this canonical issue.";
}
