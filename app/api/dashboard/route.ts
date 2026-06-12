import { refreshSponsorRuntime } from "@/lib/sponsor-runtime";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json(refreshSponsorRuntime());
}
