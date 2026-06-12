import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "default" | "muted" | "accent" | "success" | "warning";

const tones: Record<BadgeTone, string> = {
  default: "border-neutral-200 bg-white text-neutral-900",
  muted: "border-neutral-200 bg-neutral-100 text-neutral-600",
  accent: "border-blue-200 bg-blue-50 text-blue-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
};

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium leading-none",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
