"use client";

import {
  Activity,
  CheckSquare,
  Code2,
  Filter,
  Github,
  Home,
  List,
  MoreVertical,
  PanelRight,
  Settings,
  Sparkle,
  Workflow,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { MetricsSummaryCards } from "@/components/dashboard/metrics-summary-cards";
import { SignalFeed } from "@/components/dashboard/signal-feed";
import { CanonicalIssueList } from "@/components/dashboard/canonical-issue-list";
import { IssueDetailWorkspace } from "@/components/dashboard/issue-detail-workspace";
import { syncNow, useDashboardData } from "@/components/dashboard/data-client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", icon: Home, href: "/" },
  { label: "Signals", icon: PanelRight, href: "/" },
  { label: "Issues", icon: List, href: "/" },
  { label: "Work", icon: Activity, href: "/" },
  { label: "Changes", icon: Code2, href: "/" },
  { label: "Tests", icon: CheckSquare, href: "/" },
  { label: "Settings", icon: Settings, href: "/architecture" },
];

export function DashboardShell({ onRestartOnboarding }: { onRestartOnboarding: () => void }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useDashboardData();
  const [selectedIssueId, setSelectedIssueId] = useState("SE-1024");
  const [isSyncing, setIsSyncing] = useState(false);

  const selectedIssue = useMemo(
    () => data?.canonicalIssues.find((issue) => issue.id === selectedIssueId) ?? data?.canonicalIssues[0],
    [data?.canonicalIssues, selectedIssueId],
  );

  async function handleSync() {
    setIsSyncing(true);
    try {
      const runtime = await syncNow();
      queryClient.setQueryData(["ase-dashboard"], runtime);
      await queryClient.invalidateQueries({ queryKey: ["ase-workspace"] });
    } finally {
      setIsSyncing(false);
    }
  }

  if (isLoading || !data || !selectedIssue) {
    return (
      <main className="grid min-h-screen place-items-center bg-white text-black">
        <div className="text-sm text-muted-foreground">Loading autonomous control tower...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="sticky top-0 z-20 flex h-16 border-b border-border bg-white">
        <div className="flex w-full items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <Sparkle className="h-5 w-5 fill-black" aria-hidden="true" />
            <h1 className="hidden text-lg font-semibold tracking-normal sm:block">
              Autonomous Software Evolution
            </h1>
          </div>
          <button className="focus-ring hidden h-10 min-w-0 items-center gap-3 rounded-md border border-border px-4 text-sm md:flex">
            <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="truncate">{data.repo}</span>
          </button>
          <div className="flex items-center gap-3">
            <Link className="hidden text-sm text-muted-foreground hover:text-black md:inline" href="/architecture">
              Architecture
            </Link>
            <Link className="hidden text-sm text-muted-foreground hover:text-black md:inline" href="/metrics">
              Metrics
            </Link>
            <span className="hidden items-center gap-2 text-sm md:flex">
              <span className="h-2 w-2 rounded-full bg-black" />
              Agent online
            </span>
            <Button variant="outline" size="sm" onClick={handleSync} disabled={isSyncing}>
              {isSyncing ? "Syncing" : "Sync now"}
            </Button>
            <Button variant="outline" size="sm" onClick={onRestartOnboarding}>
              Setup
            </Button>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreVertical className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </header>

      <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[88px_1fr]">
        <aside className="hidden border-r border-border lg:flex lg:flex-col lg:items-center lg:justify-between lg:py-6">
          <nav className="flex w-full flex-col gap-2 px-2">
            {navItems.map((item) => (
              <Link
                key={item.label}
                className={cn(
                  "focus-ring flex h-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] text-muted-foreground",
                  item.label === "Signals" && "bg-muted text-black",
                )}
                href={item.href}
                title={item.label}
              >
                <item.icon className="h-4 w-4" aria-hidden="true" />
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="grid h-9 w-9 place-items-center rounded-full bg-black text-sm font-medium text-white">A</div>
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border px-5 py-4">
            <MetricsSummaryCards metrics={data.metrics} />
          </div>

          <div className="grid min-h-[calc(100vh-9.75rem)] grid-cols-1 xl:grid-cols-[360px_360px_minmax(0,1fr)]">
            <section className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
              <PanelHeader title="Raw Signals" count={`${data.signals.length} total`} />
              <SignalFeed
                signals={data.signals}
                selectedSignalIds={selectedIssue.signalIds}
                syncMetadata={data.syncMetadata}
              />
            </section>

            <section className="min-w-0 border-b border-border xl:border-b-0 xl:border-r">
              <PanelHeader title="Canonical Issues" count={`${data.canonicalIssues.length} clusters`} />
              <CanonicalIssueList
                issues={data.canonicalIssues}
                selectedIssueId={selectedIssue.id}
                onSelectIssue={setSelectedIssueId}
              />
            </section>

            <section className="min-w-0">
              <PanelHeader
                title="Agent Workspace"
                count={
                  <span className="flex items-center gap-2">
                    <Workflow className="h-4 w-4" aria-hidden="true" />
                    {selectedIssue.id}
                  </span>
                }
              />
              <IssueDetailWorkspace issueId={selectedIssue.id} />
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

function PanelHeader({ title, count }: { title: string; count: React.ReactNode }) {
  return (
    <div className="flex h-16 items-center justify-between border-b border-border px-5">
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        <div className="mt-1 text-xs text-muted-foreground">{count}</div>
      </div>
      <Button variant="outline" size="icon" aria-label={`Filter ${title}`}>
        <Filter className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
  );
}
