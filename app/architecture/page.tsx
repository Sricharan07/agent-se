import { ArrowRight, CircleCheck } from "lucide-react";
import { SiteFrame } from "@/components/shared/site-frame";
import { Badge } from "@/components/ui/badge";
import { getSponsorRuntime } from "@/lib/sponsor-runtime";

const architecture = [
  { sponsor: "Airbyte", role: "Signals", detail: "Syncs GitHub Issues, GitHub Discussions, and Slack." },
  { sponsor: "Signal Store", role: "Normalized Events", detail: "Stores the unified Signal schema before agents run." },
  { sponsor: "Guild", role: "Agent Team", detail: "Coordinates intake, dedup, triage, investigation, validation, and PR agents." },
  { sponsor: "Langfuse", role: "Traces", detail: "Records trace spans, tool calls, evaluations, durations, and confidence." },
  { sponsor: "Composio", role: "Actions", detail: "Creates PR payloads, comments, issues, and Slack thread updates." },
  { sponsor: "GitHub", role: "Draft PRs", detail: "Receives PRs only through the Composio action layer." },
];

export default function ArchitecturePage() {
  const runtime = getSponsorRuntime();

  return (
    <SiteFrame eyebrow="Sponsor architecture" title="Critical path">
      <div className="rounded-lg border border-border">
        <div className="grid gap-0 divide-y divide-border">
          {architecture.map((item, index) => (
            <div key={item.sponsor} className="grid gap-4 px-5 py-5 md:grid-cols-[160px_32px_190px_1fr]">
              <div className="text-sm font-semibold">{item.sponsor}</div>
              <div className="hidden items-center justify-center md:flex">
                {index < architecture.length - 1 ? (
                  <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                ) : (
                  <CircleCheck className="h-4 w-4" aria-hidden="true" />
                )}
              </div>
              <div className="text-sm">{item.role}</div>
              <p className="text-sm leading-6 text-muted-foreground">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {runtime.syncMetadata.map((sync) => (
          <div key={sync.id} className="rounded-lg border border-border p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold">{sync.source}</h2>
              <Badge tone="success">{sync.status}</Badge>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              {sync.recordsSynced} records synced at{" "}
              {new Date(sync.lastSyncAt).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </section>

      <section className="mt-8 rounded-lg border border-border p-5">
        <h2 className="text-sm font-semibold">ClickHouse observes everything</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {runtime.metrics.issueTrends.map((metric) => (
            <div key={metric.label}>
              <div className="text-xl font-semibold">{metric.value}</div>
              <div className="mt-1 text-sm font-medium">{metric.label}</div>
              <div className="mt-1 text-xs text-muted-foreground">{metric.detail}</div>
            </div>
          ))}
        </div>
      </section>
    </SiteFrame>
  );
}
