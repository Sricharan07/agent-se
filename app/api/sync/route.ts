import { refreshSponsorRuntime } from "@/lib/sponsor-runtime";
import { recordManualSync } from "@/services/local-state";

export const dynamic = "force-dynamic";

export async function POST() {
  recordManualSync();
  return Response.json(refreshSponsorRuntime());
}
