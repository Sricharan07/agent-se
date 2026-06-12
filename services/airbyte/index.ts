import { signals as seedSignals } from "@/lib/mock-data";
import type { IntegrationSource, Signal, SignalSource, SyncMetadata } from "@/lib/types";
import { insertSignal } from "@/services/clickhouse";
import { storeSyncMetadata, upsertSignals } from "@/services/signal-store";

type AirbyteSyncResult = {
  source: SyncMetadata["source"];
  status: SyncMetadata["status"];
  lastSyncAt: string;
  records: Signal[];
  metadata: SyncMetadata;
};

const syncTime = "2026-06-12T01:54:00Z";

function normalizeSignal(signal: Signal): Signal {
  return {
    ...signal,
    type: signal.type ?? signal.sourceType,
    metadata: {
      ...signal.metadata,
      ingestedBy: "airbyte",
    },
  } as Signal;
}

function syncSource(source: SyncMetadata["source"], predicate: (signal: Signal) => boolean): AirbyteSyncResult {
  const records = seedSignals.filter(predicate).map(normalizeSignal);
  const metadata: SyncMetadata = {
    id: `airbyte-${source.toLowerCase().replaceAll(" ", "-")}`,
    source,
    status: "complete",
    lastSyncAt: syncTime,
    recordsSynced: records.length,
    cursor: `${source.toLowerCase()}-${records.length}-20260612`,
  };

  upsertSignals(records);
  storeSyncMetadata(metadata);
  records.forEach(insertSignal);

  return {
    source,
    status: "complete",
    lastSyncAt: syncTime,
    records,
    metadata,
  };
}

export function syncGithubIssues() {
  return syncSource("GitHub", (signal) => signal.source === "GitHub" && signal.sourceType !== "Discussion");
}

export function syncGithubDiscussions() {
  return syncSource("Discussion", (signal) => signal.source === "Discussion");
}

export function syncSlackSignals() {
  return syncSource("Slack", (signal) => signal.source === "Slack");
}

export function syncDocsFeedback() {
  return syncSource("Docs", (signal) => signal.source === "Docs");
}

export function syncSelectedSources(sources: IntegrationSource[]) {
  const selected = new Set(sources);
  const results: AirbyteSyncResult[] = [];

  if (selected.has("GitHub")) results.push(syncGithubIssues());
  if (selected.has("Discussion")) results.push(syncGithubDiscussions());
  if (selected.has("Slack") || selected.has("Support")) results.push(syncSlackSignals());
  if (selected.has("Docs")) results.push(syncDocsFeedback());

  return results;
}

export const airbyteSources: Array<{ source: SignalSource; label: string }> = [
  { source: "GitHub", label: "GitHub Issues" },
  { source: "Discussion", label: "GitHub Discussions" },
  { source: "Slack", label: "Slack" },
  { source: "Docs", label: "Documentation feedback" },
];
