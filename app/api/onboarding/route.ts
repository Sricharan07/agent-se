import type { IntegrationSource, OnboardingConfig } from "@/lib/types";
import { refreshSponsorRuntime } from "@/lib/sponsor-runtime";
import { updateOnboardingConfig } from "@/services/local-state";

export const dynamic = "force-dynamic";

const allowedSources: IntegrationSource[] = ["GitHub", "Discussion", "Slack", "Docs", "Support", "Notion"];

function normalizeSources(value: unknown): IntegrationSource[] {
  if (!Array.isArray(value)) return ["GitHub", "Discussion", "Slack", "Docs"];
  const sources = value.filter((source): source is IntegrationSource => allowedSources.includes(source));
  return sources.length > 0 ? sources : ["GitHub"];
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<OnboardingConfig>;
  const state = updateOnboardingConfig({
    githubConnected: body.githubConnected ?? true,
    selectedRepo: body.selectedRepo || "acme/search-service",
    connectedSources: normalizeSources(body.connectedSources),
    focus: body.focus || "Bugs",
    permissions: body.permissions?.length
      ? body.permissions
      : ["Read", "Analyze", "Draft PRs", "Comment"],
    monitoringStartedAt: new Date().toISOString(),
  });

  return Response.json({
    onboarding: state.onboarding,
    runtime: refreshSponsorRuntime(),
  });
}
