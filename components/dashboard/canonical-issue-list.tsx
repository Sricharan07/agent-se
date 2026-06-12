"use client";

import { ArrowRight, CheckCircle2, CircleDashed, GitMerge, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CanonicalIssue } from "@/lib/types";
import { cn } from "@/lib/utils";

export function CanonicalIssueList({
  issues,
  selectedIssueId,
  onSelectIssue,
}: {
  issues: CanonicalIssue[];
  selectedIssueId: string;
  onSelectIssue: (issueId: string) => void;
}) {
  const statusCounts = issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.status] = (acc[issue.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-4">
        <Badge tone="default">New ({statusCounts.New ?? 0})</Badge>
        <Badge tone="muted">Triaged ({statusCounts.Triaged ?? 0})</Badge>
        <Badge tone="muted">In Progress ({statusCounts.Investigating ?? 0})</Badge>
        <Badge tone="muted">Draft PR ({statusCounts["Draft PR"] ?? 0})</Badge>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {issues.map((issue) => {
          const selected = issue.id === selectedIssueId;

          return (
            <button
              key={issue.id}
              className={cn(
                "focus-ring rounded-lg border bg-white p-4 text-left transition-colors hover:bg-neutral-50",
                selected ? "border-black" : "border-border",
              )}
              onClick={() => onSelectIssue(issue.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={priorityTone(issue.priority)}>{issue.priority}</Badge>
                    <span className="text-xs text-muted-foreground">{issue.affectedArea}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold leading-6">{issue.title}</h3>
                </div>
                <StatusIcon status={issue.status} />
              </div>

              <p className="mt-3 line-clamp-3 text-sm leading-5 text-muted-foreground">{issue.summary}</p>

              <div className="mt-4 grid gap-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <GitMerge className="h-3.5 w-3.5" aria-hidden="true" />
                    {issue.signalIds.length} sources
                  </span>
                  <span>Similarity {Math.round(issue.similarity * 100)}%</span>
                </div>
                <Progress value={issue.confidence * 100} />
              </div>

              <div className="mt-4 flex items-center justify-between text-xs">
                <Badge tone="muted">{issue.status}</Badge>
                <span className="flex items-center gap-1 text-muted-foreground">
                  Open workspace
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: CanonicalIssue["status"] }) {
  if (status === "Draft PR" || status === "Validated") {
    return <CheckCircle2 className="h-4 w-4 text-emerald-700" aria-hidden="true" />;
  }

  if (status === "Investigating") {
    return <Timer className="h-4 w-4 text-blue-700" aria-hidden="true" />;
  }

  return <CircleDashed className="h-4 w-4 text-muted-foreground" aria-hidden="true" />;
}

function priorityTone(priority: CanonicalIssue["priority"]) {
  if (priority === "Critical" || priority === "High") return "warning";
  if (priority === "Medium") return "accent";
  return "muted";
}
