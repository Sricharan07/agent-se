export type SignalSource = "GitHub" | "Slack" | "Discussion" | "Docs";

export type IntegrationSource =
  | SignalSource
  | "Support"
  | "Notion";

export type SignalType =
  | "Issue"
  | "Message"
  | "Discussion"
  | "Feedback"
  | "Incident";

export type IssueStatus = "New" | "Triaged" | "Investigating" | "Validated" | "Draft PR";

export type Priority = "Critical" | "High" | "Medium" | "Low";

export type Signal = {
  id: string;
  source: SignalSource;
  sourceRef: string;
  type: SignalType;
  sourceType: SignalType;
  repo: string;
  text: string;
  author: string;
  createdAt: string;
  metadata: {
    tags: string[];
    module: string;
    impact: string;
  };
};

export type SyncStatus = "idle" | "syncing" | "complete" | "failed";

export type SyncMetadata = {
  id: string;
  source: SignalSource;
  status: SyncStatus;
  lastSyncAt: string;
  recordsSynced: number;
  cursor: string;
};

export type CanonicalIssue = {
  id: string;
  repo: string;
  title: string;
  summary: string;
  issueType: "Bug" | "Feature Request" | "Regression" | "Noise";
  status: IssueStatus;
  priority: Priority;
  confidence: number;
  createdAt: string;
  updatedAt: string;
  signalIds: string[];
  affectedArea: string;
  similarity: number;
  mergeReason: string;
};

export type AgentRun = {
  id: string;
  canonicalIssueId: string;
  status: "Queued" | "Running" | "Complete";
  startedAt: string;
  endedAt?: string;
  outcome: string;
  modelVersion: string;
  traceId: string;
  progress: AgentProgressStep[];
};

export type AgentProgressStep = {
  label: string;
  state: "done" | "active" | "queued";
};

export type AgentStep = {
  id: string;
  agentRunId: string;
  timestamp: string;
  agent?: string;
  action: string;
  tool: string;
  inputSummary: string;
  outputSummary: string;
  confidence: number;
  durationMs: number;
};

export type Trace = {
  id: string;
  agentRunId: string;
  name: string;
  startedAt: string;
  finishedAt?: string;
  status: "running" | "complete";
};

export type TraceSpan = {
  id: string;
  traceId: string;
  agent: string;
  action: string;
  tool: string;
  inputSummary: string;
  outputSummary: string;
  confidence: number;
  durationMs: number;
  startedAt: string;
};

export type ToolCall = {
  id: string;
  spanId: string;
  tool: string;
  inputSummary: string;
  outputSummary: string;
};

export type Evaluation = {
  id: string;
  spanId: string;
  name: string;
  score: number;
  verdict: "pass" | "review";
};

export type SponsorMetric = {
  label: string;
  value: string;
  detail: string;
};

export type ClickHouseMetrics = {
  signalsIngested: number;
  canonicalIssuesCreated: number;
  duplicateReductionRate: number;
  agentSuccessRate: number;
  averageInvestigationDurationMs: number;
  draftPrCount: number;
  mergedPrCount: number;
  issueTrends: SponsorMetric[];
};

export type AgentTimelineEntry = {
  id: string;
  timestamp: string;
  agent: string;
  action: string;
  tool: string;
  durationMs: number;
  confidence: number;
};

export type ValidationArtifact = {
  id: string;
  agentRunId: string;
  artifactType: "Unit Test" | "Integration Test" | "Trace" | "Static Analysis";
  path: string;
  summary: string;
  passed: boolean;
};

export type PullRequestDraft = {
  id: string;
  canonicalIssueId: string;
  agentRunId: string;
  prUrl: string;
  status: "Draft" | "Ready for review";
  diffSummary: string;
  createdAt: string;
};

export type LearnedProcedure = {
  id: string;
  repo: string;
  canonicalIssueId?: string;
  patternName: string;
  procedureSummary: string;
  successCount: number;
  lastVerifiedAt: string;
};

export type OnboardingConfig = {
  githubConnected: boolean;
  selectedRepo: string;
  connectedSources: IntegrationSource[];
  focus: string;
  permissions: string[];
  monitoringStartedAt?: string;
};

export type LocalIssueState = {
  status?: IssueStatus;
  priority?: Priority;
  runStatus?: AgentRun["status"];
  prStatus?: PullRequestDraft["status"];
  assignedAt?: string;
  lastActionAt?: string;
};

export type LocalAppState = {
  onboarding: OnboardingConfig;
  issueState: Record<string, LocalIssueState>;
  extraSignals: Signal[];
  hiddenSignalIds: string[];
  lastManualSyncAt?: string;
};

export type AgentHealth = {
  name: string;
  status: "idle" | "running" | "complete";
  logCount: number;
};

export type DashboardRuntime = {
  repo: string;
  onboarding: OnboardingConfig;
  signals: Signal[];
  syncResults: Array<{
    source: SignalSource;
    status: SyncStatus;
    lastSyncAt: string;
    records: Signal[];
    metadata: SyncMetadata;
  }>;
  syncMetadata: SyncMetadata[];
  canonicalIssues: CanonicalIssue[];
  agentRuns: AgentRun[];
  agentSteps: AgentStep[];
  validationArtifacts: ValidationArtifact[];
  pullRequestDrafts: PullRequestDraft[];
  learnedProcedures: LearnedProcedure[];
  agents: AgentHealth[];
  metrics: ClickHouseMetrics;
  timeline: AgentTimelineEntry[];
};

export type IssueWorkspace = {
  issue: CanonicalIssue;
  sources: Signal[];
  run: AgentRun;
  steps: AgentStep[];
  artifacts: ValidationArtifact[];
  pr?: PullRequestDraft;
  learnedProcedure?: LearnedProcedure;
  traceTimeline: {
    trace?: Trace;
    spans: TraceSpan[];
    toolCalls: ToolCall[];
    evaluations: Evaluation[];
  };
  agentTimeline: AgentTimelineEntry[];
};
