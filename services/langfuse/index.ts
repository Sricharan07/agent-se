import type { AgentStep, Evaluation, ToolCall, Trace, TraceSpan } from "@/lib/types";

let traces: Trace[] = [];
let spans: TraceSpan[] = [];
let toolCalls: ToolCall[] = [];
let evaluations: Evaluation[] = [];

export function resetLangfuse() {
  traces = [];
  spans = [];
  toolCalls = [];
  evaluations = [];
}

export function startTrace(input: { id: string; agentRunId: string; name: string; startedAt: string }) {
  const trace: Trace = {
    id: input.id,
    agentRunId: input.agentRunId,
    name: input.name,
    startedAt: input.startedAt,
    status: "running",
  };

  traces.push(trace);
  return trace;
}

export function createSpan(traceId: string, step: AgentStep) {
  const span: TraceSpan = {
    id: `span-${step.id}`,
    traceId,
    agent: step.agent ?? "Guild Agent",
    action: step.action,
    tool: step.tool,
    inputSummary: step.inputSummary,
    outputSummary: step.outputSummary,
    confidence: step.confidence,
    durationMs: step.durationMs,
    startedAt: step.timestamp,
  };

  spans.push(span);
  toolCalls.push({
    id: `tool-${step.id}`,
    spanId: span.id,
    tool: step.tool,
    inputSummary: step.inputSummary,
    outputSummary: step.outputSummary,
  });

  return span;
}

export function finishSpan(spanId: string) {
  return spans.find((span) => span.id === spanId);
}

export function recordEvaluation(spanId: string, input: Omit<Evaluation, "id" | "spanId">) {
  const evaluation: Evaluation = {
    id: `eval-${evaluations.length + 1}`,
    spanId,
    ...input,
  };

  evaluations.push(evaluation);
  return evaluation;
}

export function finishTrace(traceId: string) {
  traces = traces.map((trace) =>
    trace.id === traceId
      ? { ...trace, finishedAt: "2026-06-12T01:55:00Z", status: "complete" }
      : trace,
  );
}

export function getTraceTimeline(agentRunId: string) {
  const trace = traces.find((candidate) => candidate.agentRunId === agentRunId);
  if (!trace) return { trace: undefined, spans: [], toolCalls: [], evaluations: [] };

  const traceSpans = spans.filter((span) => span.traceId === trace.id);
  const spanIds = new Set(traceSpans.map((span) => span.id));

  return {
    trace,
    spans: traceSpans,
    toolCalls: toolCalls.filter((toolCall) => spanIds.has(toolCall.spanId)),
    evaluations: evaluations.filter((evaluation) => spanIds.has(evaluation.spanId)),
  };
}
