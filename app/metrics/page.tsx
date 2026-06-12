import { SiteFrame } from "@/components/shared/site-frame";
import { Badge } from "@/components/ui/badge";
import { getSponsorRuntime } from "@/lib/sponsor-runtime";

export default function MetricsPage() {
  const { metrics, agents } = getSponsorRuntime();
  const rows = [
    {
      label: "Signals ingested",
      value: metrics.signalsIngested,
      detail: "Airbyte normalized records",
    },
    {
      label: "Canonical issues created",
      value: metrics.canonicalIssuesCreated,
      detail: "Guild dedup outputs",
    },
    {
      label: "Duplicate reduction rate",
      value: `${Math.round(metrics.duplicateReductionRate * 100)}%`,
      detail: "Signals merged before agent work",
    },
    {
      label: "Agent success rate",
      value: `${Math.round(metrics.agentSuccessRate * 100)}%`,
      detail: "Completed runs with validated output",
    },
    {
      label: "Average investigation duration",
      value: `${Math.round(metrics.averageInvestigationDurationMs / 60000)}m`,
      detail: "ClickHouse agent run duration",
    },
    {
      label: "Draft PR count",
      value: metrics.draftPrCount,
      detail: "Composio-created draft PRs",
    },
    {
      label: "Merged PR count",
      value: metrics.mergedPrCount,
      detail: "Observed PR outcomes",
    },
  ];

  return (
    <SiteFrame eyebrow="ClickHouse metrics" title="System outcomes">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <div key={row.label} className="rounded-lg border border-border p-5">
            <div className="text-3xl font-semibold tracking-normal">{row.value}</div>
            <h2 className="mt-3 text-sm font-semibold">{row.label}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{row.detail}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-border">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold">Guild agent health</h2>
        </div>
        <div className="divide-y divide-border">
          {agents.map((agent) => (
            <div key={agent.name} className="grid gap-3 px-5 py-4 md:grid-cols-[1fr_auto_auto]">
              <div className="text-sm font-medium">{agent.name}</div>
              <Badge tone="success">{agent.status}</Badge>
              <div className="text-sm text-muted-foreground">{agent.logCount} logs</div>
            </div>
          ))}
        </div>
      </section>
    </SiteFrame>
  );
}
