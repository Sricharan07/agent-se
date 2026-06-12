import type { ClickHouseMetrics } from "@/lib/types";

export function MetricsSummaryCards({ metrics }: { metrics: ClickHouseMetrics }) {
  const cards = [
    { label: "Signals", value: metrics.signalsIngested, detail: "Airbyte ingested" },
    { label: "Issues", value: metrics.canonicalIssuesCreated, detail: "Guild canonicalized" },
    {
      label: "Duplicate Rate",
      value: `${Math.round(metrics.duplicateReductionRate * 100)}%`,
      detail: "ClickHouse measured",
    },
    { label: "PRs", value: metrics.draftPrCount, detail: "Composio drafts" },
    { label: "Success", value: `${Math.round(metrics.agentSuccessRate * 100)}%`, detail: "Validated runs" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
      {cards.map((metric) => (
        <div key={metric.label} className="rounded-lg border border-border bg-white px-4 py-3">
          <div className="text-xl font-semibold tracking-normal">{metric.value}</div>
          <div className="mt-1 text-xs font-medium text-black">{metric.label}</div>
          <div className="mt-0.5 text-xs text-muted-foreground">{metric.detail}</div>
        </div>
      ))}
    </div>
  );
}
