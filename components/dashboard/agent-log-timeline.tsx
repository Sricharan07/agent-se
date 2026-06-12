import { Clock, TerminalSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AgentStep } from "@/lib/types";

export function AgentLogTimeline({ steps }: { steps: AgentStep[] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="grid grid-cols-[88px_1fr] border-b border-border bg-muted px-4 py-3 text-xs font-medium text-muted-foreground md:grid-cols-[88px_160px_150px_1fr_1fr_96px_86px]">
        <span>Time</span>
        <span className="hidden md:block">Action</span>
        <span className="hidden md:block">Tool</span>
        <span className="hidden md:block">Input</span>
        <span className="hidden md:block">Output</span>
        <span className="hidden md:block">Confidence</span>
        <span className="hidden md:block">Duration</span>
        <span className="md:hidden">Event</span>
      </div>

      {steps.map((step) => (
        <div
          key={step.id}
          className="grid grid-cols-[88px_1fr] gap-3 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[88px_160px_150px_1fr_1fr_96px_86px]"
        >
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Clock className="mt-0.5 h-3.5 w-3.5" aria-hidden="true" />
            {step.timestamp}
          </div>
          <div>
            <div className="text-sm font-medium md:hidden">{step.action}</div>
            <div className="mt-1 text-xs text-muted-foreground md:hidden">{step.tool}</div>
            <span className="hidden text-sm font-medium md:block">{step.action}</span>
          </div>
          <div className="hidden min-w-0 text-sm text-muted-foreground md:flex md:items-start md:gap-2">
            <TerminalSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{step.tool}</span>
          </div>
          <p className="hidden text-sm leading-5 text-muted-foreground md:block">{step.inputSummary}</p>
          <p className="hidden text-sm leading-5 text-black md:block">{step.outputSummary}</p>
          <div className="hidden md:block">
            <Badge tone={step.confidence >= 0.88 ? "success" : "accent"}>
              {Math.round(step.confidence * 100)}%
            </Badge>
          </div>
          <span className="hidden text-sm text-muted-foreground md:block">{(step.durationMs / 1000).toFixed(1)}s</span>
          <div className="col-span-2 grid gap-2 rounded-md border border-border p-3 text-sm md:hidden">
            <p className="text-muted-foreground">{step.inputSummary}</p>
            <p>{step.outputSummary}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
