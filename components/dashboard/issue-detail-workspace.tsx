"use client";

import { ExternalLink, GitMerge, ShieldCheck } from "lucide-react";
import { AgentTimelinePanel } from "@/components/dashboard/agent-timeline-panel";
import { AgentLogTimeline } from "@/components/dashboard/agent-log-timeline";
import { getIssueWorkspace } from "@/components/dashboard/data-client";
import { SourceIcon } from "@/components/dashboard/source-icon";
import { PrDraftCard } from "@/components/dashboard/pr-draft-card";
import { TestResultsCard } from "@/components/dashboard/test-results-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function IssueDetailWorkspace({ issueId }: { issueId: string }) {
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
  } = getIssueWorkspace(issueId);

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
                Batch facet hydration in `SearchService.getResults`, reuse the existing large-index fixture,
                and enforce query-count limits before publishing the draft PR.
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
                  <div className="text-sm font-medium">{learnedProcedure.patternName}</div>
                  <p className="mt-2 text-sm leading-5 text-muted-foreground">
                    {learnedProcedure.procedureSummary}
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
