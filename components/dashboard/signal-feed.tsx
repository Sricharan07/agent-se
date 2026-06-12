"use client";

import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { SourceIcon } from "@/components/dashboard/source-icon";
import type { Signal, SyncMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SignalFeed({
  signals,
  selectedSignalIds,
  syncMetadata,
}: {
  signals: Signal[];
  selectedSignalIds: string[];
  syncMetadata: SyncMetadata[];
}) {
  const sourceCounts = signals.reduce<Record<string, number>>((acc, signal) => {
    acc[signal.source] = (acc[signal.source] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex h-full flex-col">
      <div className="flex gap-2 overflow-x-auto border-b border-border px-5 py-4">
        <Badge tone="default">All ({signals.length})</Badge>
        {Object.entries(sourceCounts).map(([source, count]) => (
          <Badge key={source} tone="muted">
            {source} ({count})
          </Badge>
        ))}
      </div>

      <div className="grid gap-2 border-b border-border px-5 py-4">
        {syncMetadata.map((sync) => (
          <div key={sync.id} className="flex items-center justify-between gap-3 text-xs">
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-black" />
              <span className="truncate">{sync.source} source</span>
            </span>
            <span className="shrink-0 text-muted-foreground">
              {sync.status} · {sync.recordsSynced} signals · {formatSyncTime(sync.lastSyncAt)}
            </span>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 p-5">
        {signals.map((signal) => {
          const isClustered = selectedSignalIds.includes(signal.id);

          return (
            <article
              key={signal.id}
              className={cn(
                "rounded-lg border bg-white p-4 transition-colors",
                isClustered ? "border-black" : "border-border",
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <SourceIcon source={signal.source} className="h-4 w-4 shrink-0" />
                  <div className="min-w-0">
                    <div className="truncate text-xs text-muted-foreground">{signal.sourceRef}</div>
                    <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-5">{headline(signal.text)}</h3>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                  {age(signal.createdAt)}
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </div>
              </div>

              <p className="mt-3 line-clamp-2 text-sm leading-5 text-muted-foreground">{summary(signal.text)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone={isClustered ? "accent" : "muted"}>{signal.type}</Badge>
                <Badge tone="muted">{signal.metadata.module}</Badge>
                <span className="text-xs text-muted-foreground">{signal.repo}</span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function formatSyncTime(value: string) {
  return `Last sync ${new Date(value).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

function headline(text: string) {
  return text.split(".")[0] ?? text;
}

function summary(text: string) {
  const [, ...rest] = text.split(".");
  return rest.join(".").trim() || text;
}

function age(createdAt: string) {
  const minutes = Math.max(1, Math.round((Date.parse("2026-06-12T01:49:00Z") - Date.parse(createdAt)) / 60000));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  return `${hours}h`;
}
