"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { AgentTimelineEntry } from "@/lib/types";

export function AgentTimelinePanel({ entries }: { entries: AgentTimelineEntry[] }) {
  const [query, setQuery] = useState("");
  const filteredEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries;

    return entries.filter((entry) =>
      [entry.timestamp, entry.agent, entry.action, entry.tool].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    );
  }, [entries, query]);

  return (
    <section className="rounded-lg border border-border">
      <div className="flex flex-col gap-3 border-b border-border px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-sm font-semibold">Agent Timeline</h3>
          <p className="mt-1 text-xs text-muted-foreground">Guild activity from Langfuse spans</p>
        </div>
        <label className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm text-muted-foreground md:w-64">
          <Search className="h-4 w-4" aria-hidden="true" />
          <input
            className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
            placeholder="Search timeline"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[92px_170px_1fr_190px_90px_90px] border-b border-border bg-muted px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>Timestamp</span>
          <span>Agent</span>
          <span>Action</span>
          <span>Tool</span>
          <span>Duration</span>
          <span>Confidence</span>
        </div>
        {filteredEntries.map((entry) => (
          <div
            key={entry.id}
            className="grid min-w-[760px] grid-cols-[92px_170px_1fr_190px_90px_90px] border-b border-border px-4 py-3 text-sm last:border-b-0"
          >
            <span className="text-muted-foreground">{entry.timestamp}</span>
            <span className="font-medium">{entry.agent}</span>
            <span>{entry.action}</span>
            <span className="text-muted-foreground">{entry.tool}</span>
            <span className="text-muted-foreground">{(entry.durationMs / 1000).toFixed(1)}s</span>
            <Badge tone={entry.confidence >= 0.88 ? "success" : "accent"}>
              {Math.round(entry.confidence * 100)}%
            </Badge>
          </div>
        ))}
      </div>
    </section>
  );
}
