"use client";

import { useQuery } from "@tanstack/react-query";
import { getSponsorRuntime, getWorkspaceForIssue, refreshSponsorRuntime } from "@/lib/sponsor-runtime";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function useDashboardData() {
  return useQuery({
    queryKey: ["ase-dashboard"],
    queryFn: async () => {
      await wait(180);
      return refreshSponsorRuntime();
    },
  });
}

export function getIssueWorkspace(issueId: string) {
  getSponsorRuntime();
  return getWorkspaceForIssue(issueId);
}
