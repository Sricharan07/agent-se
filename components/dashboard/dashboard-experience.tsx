"use client";

import { useState } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export function DashboardExperience() {
  const [onboarded, setOnboarded] = useState(false);

  if (!onboarded) {
    return <OnboardingWizard onComplete={() => setOnboarded(true)} />;
  }

  return <DashboardShell onRestartOnboarding={() => setOnboarded(false)} />;
}
