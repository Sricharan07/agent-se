import { CheckCircle2, CircleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ValidationArtifact } from "@/lib/types";

export function TestResultsCard({ artifacts }: { artifacts: ValidationArtifact[] }) {
  const passed = artifacts.filter((artifact) => artifact.passed).length;

  return (
    <section className="rounded-lg border border-border">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold">Tests</h3>
        <Badge tone={passed === artifacts.length ? "success" : "warning"}>
          {passed}/{artifacts.length} passed
        </Badge>
      </div>
      <div className="divide-y divide-border">
        {artifacts.map((artifact) => (
          <div key={artifact.id} className="flex items-start gap-3 px-4 py-4">
            {artifact.passed ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" aria-hidden="true" />
            ) : (
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            )}
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{artifact.artifactType}</span>
                <span className="font-mono text-xs text-muted-foreground">{artifact.path}</span>
              </div>
              <p className="mt-2 text-sm leading-5 text-muted-foreground">{artifact.summary}</p>
            </div>
          </div>
        ))}
        {artifacts.length === 0 ? (
          <div className="px-4 py-5 text-sm leading-5 text-muted-foreground">
            Validation has not started for this canonical issue yet.
          </div>
        ) : null}
      </div>
    </section>
  );
}
