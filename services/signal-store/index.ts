import type { Signal, SyncMetadata } from "@/lib/types";

let signalStore: Signal[] = [];
let syncStore: SyncMetadata[] = [];

export function resetSignalStore() {
  signalStore = [];
  syncStore = [];
}

export function upsertSignals(signals: Signal[]) {
  const byId = new Map(signalStore.map((signal) => [signal.id, signal]));

  for (const signal of signals) {
    byId.set(signal.id, signal);
  }

  signalStore = Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt),
  );
}

export function listSignals() {
  return signalStore;
}

export function getSignalsByIds(ids: string[]) {
  const idSet = new Set(ids);
  return signalStore.filter((signal) => idSet.has(signal.id));
}

export function storeSyncMetadata(metadata: SyncMetadata) {
  syncStore = [metadata, ...syncStore.filter((sync) => sync.id !== metadata.id)];
}

export function listSyncMetadata() {
  return syncStore.sort((a, b) => Date.parse(b.lastSyncAt) - Date.parse(a.lastSyncAt));
}
