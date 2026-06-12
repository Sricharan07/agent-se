import { getWorkspaceForIssue, refreshSponsorRuntime } from "@/lib/sponsor-runtime";
import { updateIssueState } from "@/services/local-state";

export const dynamic = "force-dynamic";

export async function POST(_request: Request, { params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  updateIssueState(issueId, {
    status: "Investigating",
    runStatus: "Running",
    assignedAt: new Date().toISOString(),
  });
  refreshSponsorRuntime();
  return Response.json(getWorkspaceForIssue(issueId));
}
