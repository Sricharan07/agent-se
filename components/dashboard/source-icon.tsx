import { FileText, Github, MessageSquare, Slack } from "lucide-react";
import type { SignalSource } from "@/lib/types";

export function SourceIcon({ source, className }: { source: SignalSource; className?: string }) {
  const Icon =
    source === "GitHub" ? Github : source === "Slack" ? Slack : source === "Discussion" ? MessageSquare : FileText;

  return <Icon className={className} aria-hidden="true" />;
}
