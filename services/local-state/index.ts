import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { LocalAppState, OnboardingConfig } from "@/lib/types";

const stateFile = join(process.cwd(), ".data", "ase-state.json");

export const defaultOnboarding: OnboardingConfig = {
  githubConnected: true,
  selectedRepo: "acme/search-service",
  connectedSources: ["GitHub", "Discussion", "Slack", "Docs"],
  focus: "Bugs",
  permissions: ["Read", "Analyze", "Draft PRs", "Comment"],
  monitoringStartedAt: "2026-06-12T01:54:00Z",
};

export const defaultLocalState: LocalAppState = {
  onboarding: defaultOnboarding,
  issueState: {
    "SE-1024": { status: "Investigating", priority: "High", runStatus: "Running" },
    "SE-1025": { status: "New", priority: "Medium", runStatus: "Queued" },
    "SE-1026": { status: "Triaged", priority: "Low", runStatus: "Queued" },
    "SE-1027": { status: "Draft PR", priority: "Medium", runStatus: "Complete", prStatus: "Ready for review" },
  },
  extraSignals: [],
  hiddenSignalIds: [],
  lastManualSyncAt: "2026-06-12T01:54:00Z",
};

function cloneState(state: LocalAppState): LocalAppState {
  return JSON.parse(JSON.stringify(state)) as LocalAppState;
}

function writeState(state: LocalAppState) {
  mkdirSync(dirname(stateFile), { recursive: true });
  writeFileSync(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
}

export function readLocalState(): LocalAppState {
  try {
    const parsed = JSON.parse(readFileSync(stateFile, "utf8")) as Partial<LocalAppState>;
    return {
      ...cloneState(defaultLocalState),
      ...parsed,
      onboarding: {
        ...defaultLocalState.onboarding,
        ...parsed.onboarding,
      },
      issueState: {
        ...defaultLocalState.issueState,
        ...parsed.issueState,
      },
      extraSignals: parsed.extraSignals ?? [],
      hiddenSignalIds: parsed.hiddenSignalIds ?? [],
    };
  } catch {
    const initialState = cloneState(defaultLocalState);
    writeState(initialState);
    return initialState;
  }
}

export function saveLocalState(updater: (state: LocalAppState) => LocalAppState) {
  const nextState = updater(readLocalState());
  writeState(nextState);
  return nextState;
}

export function updateOnboardingConfig(config: Partial<OnboardingConfig>) {
  return saveLocalState((state) => ({
    ...state,
    onboarding: {
      ...state.onboarding,
      ...config,
      githubConnected: config.githubConnected ?? state.onboarding.githubConnected,
    },
  }));
}

export function updateIssueState(issueId: string, patch: LocalAppState["issueState"][string]) {
  return saveLocalState((state) => ({
    ...state,
    issueState: {
      ...state.issueState,
      [issueId]: {
        ...state.issueState[issueId],
        ...patch,
        lastActionAt: new Date().toISOString(),
      },
    },
  }));
}

export function recordManualSync() {
  return saveLocalState((state) => ({
    ...state,
    lastManualSyncAt: new Date().toISOString(),
  }));
}
