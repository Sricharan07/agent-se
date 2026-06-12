import { ExternalLink, GitPullRequestDraft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PullRequestDraft } from "@/lib/types";

export function PrDraftCard({ draft }: { draft?: PullRequestDraft }) {
  return (
    <section className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Draft PR</h3>
        <Badge tone={draft ? "accent" : "muted"}>{draft?.status ?? "Preparing"}</Badge>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <GitPullRequestDraft className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="text-sm leading-5 text-muted-foreground">
              {draft?.diffSummary ??
                "The PR agent is waiting for final validation before publishing a draft pull request."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Button variant="outline" size="sm" disabled={!draft}>
                Open on GitHub
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
              <Button variant="ghost" size="sm">
                View diff summary
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
