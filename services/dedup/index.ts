import type { CanonicalIssue, IssueStatus, LocalAppState, Priority, Signal } from "@/lib/types";

type ClusterTemplate = {
  id: string;
  title: string;
  summary: string;
  issueType: CanonicalIssue["issueType"];
  affectedArea: string;
  defaultPriority: Priority;
  defaultStatus: IssueStatus;
  reason: string;
};

const templates: Record<string, ClusterTemplate> = {
  "search-timeout": {
    id: "SE-1024",
    title: "Slow or timeout in search with large datasets",
    summary: "Users experience slow search or complete timeouts when datasets exceed the large-index threshold.",
    issueType: "Bug",
    affectedArea: "search-service",
    defaultPriority: "High",
    defaultStatus: "Investigating",
    reason: "Same repository, search module, timeout or slow-query symptom, large dataset trigger, and overlapping report window.",
  },
  "search-filter": {
    id: "SE-1025",
    title: "Add date range filter for search results",
    summary: "Request to support filtering search results by date range before exporting large result sets.",
    issueType: "Feature Request",
    affectedArea: "search-ui",
    defaultPriority: "Medium",
    defaultStatus: "New",
    reason: "Shared search result improvement intent from docs and discussion feedback.",
  },
  "ranking-exact-match": {
    id: "SE-1026",
    title: "Search relevance issues for exact matches",
    summary: "Exact match results are not ranked correctly for some queries after the latest relevance update.",
    issueType: "Regression",
    affectedArea: "ranking",
    defaultPriority: "Low",
    defaultStatus: "Triaged",
    reason: "Ranking-specific symptom family remains separate from timeout and filtering work.",
  },
  "index-refresh": {
    id: "SE-1027",
    title: "Index refresh leaves stale records after import",
    summary: "Nightly import can fail during refresh and leave stale search records visible.",
    issueType: "Bug",
    affectedArea: "indexer",
    defaultPriority: "Medium",
    defaultStatus: "Draft PR",
    reason: "Distinct indexing failure, not clustered with search timeout reports.",
  },
};

function normalizedTokens(text: string) {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 3),
  );
}

function tokenSimilarity(signals: Signal[]) {
  if (signals.length <= 1) return 0.76;

  const tokenSets = signals.map((signal) => normalizedTokens(`${signal.text} ${signal.metadata.tags.join(" ")}`));
  let comparisons = 0;
  let score = 0;

  for (let outer = 0; outer < tokenSets.length; outer += 1) {
    for (let inner = outer + 1; inner < tokenSets.length; inner += 1) {
      const a = tokenSets[outer];
      const b = tokenSets[inner];
      const union = new Set([...a, ...b]);
      const intersection = [...a].filter((token) => b.has(token));
      score += union.size === 0 ? 0 : intersection.length / union.size;
      comparisons += 1;
    }
  }

  return comparisons === 0 ? 0.76 : score / comparisons;
}

function classifySignal(signal: Signal) {
  const text = `${signal.text} ${signal.metadata.tags.join(" ")} ${signal.metadata.module}`.toLowerCase();

  if (text.includes("index refresh") || text.includes("stale") || signal.metadata.module === "indexer") {
    return "index-refresh";
  }

  if (text.includes("exact match") || text.includes("relevance") || signal.metadata.module === "ranking") {
    return "ranking-exact-match";
  }

  if (text.includes("date range") || text.includes("filter") || text.includes("enhancement") || text.includes("feature")) {
    return "search-filter";
  }

  if (text.includes("timeout") || text.includes("slow") || text.includes("performance") || text.includes("large dataset")) {
    return "search-timeout";
  }

  return `${signal.metadata.module || "general"}-triage`;
}

function fallbackTemplate(clusterKey: string, signals: Signal[]): ClusterTemplate {
  const firstSignal = signals[0];
  const moduleName = firstSignal?.metadata.module || "general";

  return {
    id: `SE-${1000 + Math.abs(clusterKey.split("").reduce((total, char) => total + char.charCodeAt(0), 0))}`,
    title: `Review ${moduleName} feedback cluster`,
    summary: firstSignal?.text ?? "New signal cluster needs triage.",
    issueType: "Bug",
    affectedArea: moduleName,
    defaultPriority: "Medium",
    defaultStatus: "Triaged",
    reason: "Signals share repository, module, and nearby symptom terms but need maintainer confirmation.",
  };
}

function confidenceFor(signals: Signal[]) {
  const sourceDiversity = new Set(signals.map((signal) => signal.source)).size;
  const sourceBonus = Math.min(0.12, (signals.length - 1) * 0.05);
  const diversityBonus = Math.min(0.06, (sourceDiversity - 1) * 0.03);
  const similarity = tokenSimilarity(signals);

  return Math.min(0.96, Math.max(0.68, 0.7 + sourceBonus + diversityBonus + similarity * 0.18));
}

export function clusterSignals(signals: Signal[], state: LocalAppState) {
  const visibleSignals = signals.filter((signal) => !state.hiddenSignalIds.includes(signal.id));
  const grouped = visibleSignals.reduce<Record<string, Signal[]>>((acc, signal) => {
    const clusterKey = classifySignal(signal);
    acc[clusterKey] = [...(acc[clusterKey] ?? []), signal];
    return acc;
  }, {});

  return Object.entries(grouped)
    .map(([clusterKey, clusterSignalsForKey]) => {
      const template = templates[clusterKey] ?? fallbackTemplate(clusterKey, clusterSignalsForKey);
      const override = state.issueState[template.id];
      const confidence = confidenceFor(clusterSignalsForKey);
      const createdAt = clusterSignalsForKey
        .map((signal) => signal.createdAt)
        .sort((a, b) => Date.parse(a) - Date.parse(b))[0];
      const updatedAt = clusterSignalsForKey
        .map((signal) => signal.createdAt)
        .sort((a, b) => Date.parse(b) - Date.parse(a))[0];

      return {
        id: template.id,
        repo: clusterSignalsForKey[0]?.repo ?? state.onboarding.selectedRepo.replace(" / ", "/"),
        title: template.title,
        summary: template.summary,
        issueType: template.issueType,
        status: override?.status ?? template.defaultStatus,
        priority: override?.priority ?? template.defaultPriority,
        confidence,
        createdAt,
        updatedAt,
        signalIds: clusterSignalsForKey.map((signal) => signal.id),
        affectedArea: template.affectedArea,
        similarity: confidence,
        mergeReason: template.reason,
      } satisfies CanonicalIssue;
    })
    .sort((a, b) => {
      const priorityOrder: Record<Priority, number> = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || Date.parse(b.updatedAt) - Date.parse(a.updatedAt);
    });
}
