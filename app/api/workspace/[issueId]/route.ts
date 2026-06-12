import { refreshSponsorRuntime, getWorkspaceForIssue } from "@/lib/sponsor-runtime";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: { params: Promise<{ issueId: string }> }) {
  const { issueId } = await params;
  refreshSponsorRuntime();
  return Response.json(getWorkspaceForIssue(issueId));
}
