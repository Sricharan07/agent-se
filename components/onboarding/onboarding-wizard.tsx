"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Code2,
  Database,
  FileText,
  Github,
  Inbox,
  LockKeyhole,
  Search,
  ShieldCheck,
  Slack,
  Sparkle,
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { saveOnboarding } from "@/components/dashboard/data-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import type { IntegrationSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const steps = ["Connect GitHub", "Select Repository", "Configure Sources", "Review & Start"];

const repositories = [
  { name: "acme / search-service", updated: "Updated 2h ago", visibility: "Private" },
  { name: "acme / api-gateway", updated: "Updated 1d ago", visibility: "Private" },
  { name: "acme / web-dashboard", updated: "Updated 3d ago", visibility: "Private" },
  { name: "acme / data-pipeline", updated: "Updated 5d ago", visibility: "Private" },
  { name: "acme / docs-site", updated: "Updated 1w ago", visibility: "Public" },
];

const sourceOptions: Array<{
  id: IntegrationSource;
  name: string;
  detail: string;
  icon: typeof Github;
  defaultConnected: boolean;
}> = [
  { id: "GitHub", name: "GitHub Issues", detail: "Pull issues from the repository", icon: Github, defaultConnected: true },
  { id: "Discussion", name: "GitHub Discussions", detail: "Monitor discussions and ideas", icon: Github, defaultConnected: true },
  { id: "Slack", name: "Slack", detail: "Collect feedback from channels", icon: Slack, defaultConnected: true },
  { id: "Docs", name: "Documentation", detail: "Ingest docs feedback and product signals", icon: FileText, defaultConnected: true },
  { id: "Support", name: "Support Inbox", detail: "Import customer reports through the Slack facade", icon: Inbox, defaultConnected: false },
  { id: "Notion", name: "Notion", detail: "Capture project notes when an integration is added", icon: FileText, defaultConnected: false },
];

const focusOptions = ["Bugs", "Feature Requests", "Performance", "Docs", "Code Quality", "Other"];

export function OnboardingWizard({ onComplete }: { onComplete: () => void }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState(0);
  const [githubConnected, setGithubConnected] = useState(true);
  const [selectedRepo, setSelectedRepo] = useState(repositories[0].name);
  const [focus, setFocus] = useState("Bugs");
  const [connectedSourceIds, setConnectedSourceIds] = useState<IntegrationSource[]>(
    sourceOptions.filter((source) => source.defaultConnected).map((source) => source.id),
  );

  const connectedSources = useMemo(
    () => sourceOptions.filter((source) => connectedSourceIds.includes(source.id)).map((source) => source.name),
    [connectedSourceIds],
  );
  const onboardingMutation = useMutation({
    mutationFn: () =>
      saveOnboarding({
        githubConnected,
        selectedRepo,
        connectedSources: connectedSourceIds,
        focus,
        permissions: ["Read", "Analyze", "Draft PRs", "Comment"],
        monitoringStartedAt: new Date().toISOString(),
      }),
    onSuccess: (result) => {
      queryClient.setQueryData(["ase-dashboard"], result.runtime);
      onComplete();
    },
  });

  function continueFlow() {
    if (step === steps.length - 1) {
      onboardingMutation.mutate();
      return;
    }

    setStep((current) => current + 1);
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <header className="flex h-16 items-center border-b border-border px-6">
        <div className="flex items-center gap-3">
          <Sparkle className="h-5 w-5 fill-black" aria-hidden="true" />
          <h1 className="text-base font-semibold">Autonomous Software Evolution</h1>
        </div>
      </header>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-8">
        <StepIndicator currentStep={step} />

        <Card className="min-h-[520px] p-6 shadow-subtle">
          {step === 0 ? <ConnectStep connected={githubConnected} onConnect={() => setGithubConnected(true)} /> : null}
          {step === 1 ? (
            <RepositoryStep selectedRepo={selectedRepo} onSelectRepo={setSelectedRepo} />
          ) : null}
          {step === 2 ? (
            <SourcesStep
              connectedSources={connectedSourceIds}
              focus={focus}
              onFocusChange={setFocus}
              onToggleSource={(sourceId) =>
                setConnectedSourceIds((current) =>
                  current.includes(sourceId)
                    ? current.filter((candidate) => candidate !== sourceId)
                    : [...current, sourceId],
                )
              }
            />
          ) : null}
          {step === 3 ? (
            <ReviewStep selectedRepo={selectedRepo} connectedSources={connectedSources} focus={focus} />
          ) : null}

          <div className="mt-8 flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => setStep((current) => Math.max(0, current - 1))}
              disabled={step === 0}
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Back
            </Button>
            <Button onClick={continueFlow} disabled={onboardingMutation.isPending}>
              {step === steps.length - 1
                ? onboardingMutation.isPending
                  ? "Starting..."
                  : "Start autonomous monitoring"
                : "Continue"}
              {step === steps.length - 1 ? (
                <Sparkle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          </div>
        </Card>
      </section>
    </main>
  );
}

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      {steps.map((label, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;

        return (
          <div key={label} className="flex items-center gap-3">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                isCurrent && "border-black bg-black text-white",
                isComplete && "border-black bg-white text-black",
                !isCurrent && !isComplete && "border-border bg-muted text-muted-foreground",
              )}
            >
              {isComplete ? <Check className="h-4 w-4" aria-hidden="true" /> : index + 1}
            </span>
            <span className={cn("text-sm", isCurrent ? "font-medium text-black" : "text-muted-foreground")}>
              {label}
            </span>
            {index < steps.length - 1 ? <span className="hidden h-px flex-1 bg-border md:block" /> : null}
          </div>
        );
      })}
    </div>
  );
}

function ConnectStep({ connected, onConnect }: { connected: boolean; onConnect: () => void }) {
  return (
    <div className="grid min-h-[420px] items-center gap-10 lg:grid-cols-[1fr_0.95fr]">
      <div className="flex items-center justify-center">
        <div className="relative grid h-72 w-72 place-items-center">
          <div className="absolute left-1/2 top-10 h-52 border-l border-dashed border-neutral-300" />
          <div className="absolute top-1/2 h-px w-52 border-t border-dashed border-neutral-300" />
          <IconNode className="left-1/2 top-4 -translate-x-1/2" icon={Github} />
          <IconNode className="bottom-4 left-1/2 -translate-x-1/2" icon={Database} />
          <IconNode className="left-4 top-1/2 -translate-y-1/2" icon={Slack} />
          <IconNode className="right-4 top-1/2 -translate-y-1/2" icon={FileText} />
          <div className="relative z-10 flex h-24 w-32 items-center justify-center rounded-lg border border-black bg-white">
            <Code2 className="h-8 w-8" aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="max-w-md">
        <h2 className="text-2xl font-semibold tracking-normal">Connect your GitHub account</h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          We will use GitHub to access repositories, issues, discussions, and code with your permissions.
        </p>
        <Button className="mt-8" variant={connected ? "outline" : "default"} onClick={onConnect}>
          <Github className="h-4 w-4" aria-hidden="true" />
          {connected ? "GitHub connected" : "Continue with GitHub"}
        </Button>
        <p className="mt-8 flex max-w-xs items-start gap-3 text-xs leading-5 text-muted-foreground">
          <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          Secure OAuth authentication. We never store your password.
        </p>
      </div>
    </div>
  );
}

function IconNode({ icon: Icon, className }: { icon: typeof Github; className: string }) {
  return (
    <div
      className={cn(
        "absolute z-10 grid h-12 w-12 place-items-center rounded-lg border border-border bg-white",
        className,
      )}
    >
      <Icon className="h-6 w-6" aria-hidden="true" />
    </div>
  );
}

function RepositoryStep({
  selectedRepo,
  onSelectRepo,
}: {
  selectedRepo: string;
  onSelectRepo: (repo: string) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h2 className="text-2xl font-semibold">Select a repository</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Choose the repository you want the agent to monitor and improve.
      </p>
      <label className="mt-6 flex h-11 items-center gap-3 rounded-md border border-border px-3 text-sm text-muted-foreground">
        <Search className="h-4 w-4" aria-hidden="true" />
        <input className="w-full outline-none placeholder:text-muted-foreground" placeholder="Search repositories" />
      </label>
      <div className="mt-4 overflow-hidden rounded-lg border border-border">
        {repositories.map((repository) => {
          const selected = repository.name === selectedRepo;

          return (
            <button
              key={repository.name}
              className={cn(
                "focus-ring grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-4 border-b border-border px-4 py-4 text-left last:border-b-0 hover:bg-muted",
                selected && "bg-neutral-50",
              )}
              onClick={() => onSelectRepo(repository.name)}
            >
              <span
                className={cn(
                  "grid h-4 w-4 place-items-center rounded-full border",
                  selected ? "border-black bg-black" : "border-neutral-300 bg-white",
                )}
              >
                {selected ? <span className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="flex min-w-0 items-center gap-3">
                <Github className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-sm font-medium">{repository.name}</span>
              </span>
              <span className="hidden text-xs text-muted-foreground sm:inline">{repository.updated}</span>
              <Badge tone="muted">{repository.visibility}</Badge>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SourcesStep({
  connectedSources,
  focus,
  onFocusChange,
  onToggleSource,
}: {
  connectedSources: IntegrationSource[];
  focus: string;
  onFocusChange: (focus: string) => void;
  onToggleSource: (source: IntegrationSource) => void;
}) {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <h2 className="text-2xl font-semibold">Configure sources</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Connect the sources the agent will use to collect and understand signals.
      </p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {sourceOptions.map((source) => {
          const connected = connectedSources.includes(source.id);

          return (
          <button
            key={source.name}
            className={cn(
              "focus-ring flex items-center justify-between rounded-lg border p-4 text-left transition-colors hover:bg-muted",
              connected ? "border-black" : "border-border",
            )}
            onClick={() => onToggleSource(source.id)}
          >
            <div className="flex min-w-0 items-center gap-4">
              <source.icon className="h-7 w-7 shrink-0" aria-hidden="true" />
              <div>
                <h3 className="text-sm font-semibold">{source.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{source.detail}</p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              {connected ? "Connected" : "Optional"}
              <span
                className={cn(
                  "grid h-5 w-5 place-items-center rounded-full border",
                  connected ? "border-black" : "border-neutral-300",
                )}
              >
                {connected ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
              </span>
            </span>
          </button>
          );
        })}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-semibold">Primary focus</h3>
        <div className="mt-3 flex flex-wrap gap-3">
          {focusOptions.map((option) => (
            <button
              key={option}
              className={cn(
                "focus-ring h-9 rounded-md border px-5 text-sm",
                option === focus
                  ? "border-black bg-white text-black"
                  : "border-border bg-white text-muted-foreground hover:bg-muted",
              )}
              onClick={() => onFocusChange(option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReviewStep({
  selectedRepo,
  connectedSources,
  focus,
}: {
  selectedRepo: string;
  connectedSources: string[];
  focus: string;
}) {
  const rows = [
    { label: "Repository", value: selectedRepo, icon: Github },
    { label: "Permissions", value: "Read, Analyze, Draft PRs, Comment", icon: LockKeyhole },
    { label: "Sources", value: connectedSources.join(", "), icon: Slack },
    { label: "Primary focus", value: focus, icon: Search },
    { label: "Agent behavior", value: "Auto-detect issues, triage, propose fixes, draft PRs", icon: Sparkle },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl">
      <h2 className="text-2xl font-semibold">Review & start monitoring</h2>
      <p className="mt-2 text-sm text-muted-foreground">Review your configuration before the agent begins.</p>

      <div className="mt-6 overflow-hidden rounded-lg border border-border">
        {rows.map((row) => (
          <div
            key={row.label}
            className="grid grid-cols-[auto_1fr] gap-4 border-b border-border px-4 py-4 last:border-b-0 md:grid-cols-[auto_180px_1fr_auto]"
          >
            <row.icon className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-medium">{row.label}</span>
            <span className="text-sm text-muted-foreground">{row.value}</span>
            <Button className="hidden md:inline-flex" variant="outline" size="sm">
              Edit
            </Button>
          </div>
        ))}
      </div>

      <div className="mt-8 flex items-start gap-4 rounded-lg border border-border p-5">
        <ShieldCheck className="h-7 w-7 shrink-0" aria-hidden="true" />
        <div>
          <h3 className="text-sm font-semibold">Safe by default</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The agent opens draft PRs for human review. Nothing is merged without approval.
          </p>
        </div>
      </div>
    </div>
  );
}
