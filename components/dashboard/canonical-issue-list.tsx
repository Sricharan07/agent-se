"use client";

import { ArrowRight, CheckCircle2, CircleDashed, GitMerge, Search, Timer } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CanonicalIssue, IssueStatus } from "@/lib/types";
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
  const [statusFilter, setStatusFilter] = useState<IssueStatus | "All">("All");
  const [query, setQuery] = useState("");
  const statusCounts = issues.reduce<Record<string, number>>((acc, issue) => {
    acc[issue.status] = (acc[issue.status] ?? 0) + 1;
    return acc;
  }, {});
  const filteredIssues = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return issues.filter((issue) => {
      const matchesStatus = statusFilter === "All" || issue.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        [issue.id, issue.title, issue.summary, issue.affectedArea, issue.priority, issue.status]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [issues, query, statusFilter]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-4">
        <button onClick={() => setStatusFilter("All")}>
          <Badge tone={statusFilter === "All" ? "default" : "muted"}>All ({issues.length})</Badge>
        </button>
        <StatusFilterButton count={statusCounts.New ?? 0} filter="New" label="New" selected={statusFilter} onSelect={setStatusFilter} />
        <StatusFilterButton count={statusCounts.Triaged ?? 0} filter="Triaged" label="Triaged" selected={statusFilter} onSelect={setStatusFilter} />
        <StatusFilterButton
          count={statusCounts.Investigating ?? 0}
          filter="Investigating"
          label="In Progress"
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
        <StatusFilterButton
          count={statusCounts["Draft PR"] ?? 0}
          filter="Draft PR"
          label="Draft PR"
          selected={statusFilter}
          onSelect={setStatusFilter}
        />
      </div>

      <div className="border-b border-border px-5 py-4">
        <label className="flex h-10 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search issues"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 p-5">
        {filteredIssues.map((issue) => {
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
        {filteredIssues.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            No canonical issues match this filter.
          </div>
        ) : null}
      </div>
    </div>
  );
}

function StatusFilterButton({
  count,
  filter,
  label,
  selected,
  onSelect,
}: {
  count: number;
  filter: IssueStatus;
  label: string;
  selected: IssueStatus | "All";
  onSelect: (filter: IssueStatus) => void;
}) {
  return (
    <button onClick={() => onSelect(filter)}>
      <Badge tone={selected === filter ? "default" : "muted"}>
        {label} ({count})
      </Badge>
    </button>
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
