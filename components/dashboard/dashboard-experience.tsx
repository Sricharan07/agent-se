"use client";

import { useSyncExternalStore } from "react";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

const onboardingStorageKey = "ase:onboarded";
const onboardingChangeEvent = "ase:onboarding-change";

function subscribeOnboarding(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(onboardingChangeEvent, callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(onboardingChangeEvent, callback);
  };
}

function getOnboardingSnapshot() {
  return window.localStorage.getItem(onboardingStorageKey) === "true" ? "true" : "false";
}

function getServerOnboardingSnapshot() {
  return "false";
}

function emitOnboardingChange() {
  window.dispatchEvent(new Event(onboardingChangeEvent));
}

export function DashboardExperience() {
  const onboarded =
    useSyncExternalStore(subscribeOnboarding, getOnboardingSnapshot, getServerOnboardingSnapshot) === "true";

  function completeOnboarding() {
    window.localStorage.setItem(onboardingStorageKey, "true");
    emitOnboardingChange();
  }

  function restartOnboarding() {
    window.localStorage.removeItem(onboardingStorageKey);
    emitOnboardingChange();
  }

  if (!onboarded) {
    return <OnboardingWizard onComplete={completeOnboarding} />;
  }

  return <DashboardShell onRestartOnboarding={restartOnboarding} />;
}
