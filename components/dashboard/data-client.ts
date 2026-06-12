"use client";

import { useQuery } from "@tanstack/react-query";
import type { DashboardRuntime, IssueWorkspace, OnboardingConfig } from "@/lib/types";

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export function useDashboardData() {
  return useQuery({
    queryKey: ["ase-dashboard"],
    queryFn: () => requestJson<DashboardRuntime>("/api/dashboard"),
  });
}

export function useIssueWorkspace(issueId: string) {
  return useQuery({
    queryKey: ["ase-workspace", issueId],
    queryFn: () => requestJson<IssueWorkspace>(`/api/workspace/${issueId}`),
    enabled: Boolean(issueId),
  });
}

export function saveOnboarding(config: OnboardingConfig) {
  return requestJson<{ onboarding: OnboardingConfig; runtime: DashboardRuntime }>("/api/onboarding", {
    method: "POST",
    body: JSON.stringify(config),
  });
}

export function syncNow() {
  return requestJson<DashboardRuntime>("/api/sync", { method: "POST" });
}

export function startAgentRun(issueId: string) {
  return requestJson<IssueWorkspace>(`/api/issues/${issueId}/run`, { method: "POST" });
}

export function publishDraftPr(issueId: string) {
  return requestJson<IssueWorkspace>(`/api/issues/${issueId}/pr`, { method: "POST" });
}
