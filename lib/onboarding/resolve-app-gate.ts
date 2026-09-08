import type { Result } from '@/lib/core';
import { isProfileComplete, type UserProfile } from '@/lib/domain/profile';
import { resolveHealthDataConsentGate } from '@/lib/onboarding/resolve-health-data-consent-gate';
import {
  resolveUnauthenticatedAppGate,
  type UnauthenticatedAppGateResult,
} from '@/lib/onboarding/resolve-unauthenticated-app-gate';

export type AuthenticatedOnboardingGateDestination = 'onboarding' | 'onboarding-step-4' | 'home';

export type OnboardingGateDestination =
  | AuthenticatedOnboardingGateDestination
  | 'check-email'
  | 'authenticated-health-data-consent';

export type AppGateResult =
  | UnauthenticatedAppGateResult
  | { destination: AuthenticatedOnboardingGateDestination }
  | { destination: 'authenticated-health-data-consent' };

export type ResolveAppGateConsentDeps = {
  persistPendingConsent: (userId: string) => Promise<unknown>;
  hasActiveCurrentConsent: (userId: string) => Promise<boolean>;
};

export type AuthenticatedOnboardingGateDeps = {
  getCurrentProfile: () => Promise<Result<UserProfile | null>>;
  setOnboardingCompleteForUser: (userId: string, complete: boolean) => Promise<void>;
  getOnboardingCompleteForUser: (userId: string) => Promise<boolean | null>;
};

const defaultAuthenticatedOnboardingGateDeps: AuthenticatedOnboardingGateDeps = {
  async getCurrentProfile() {
    const { profileService } = await import('@/lib/services/profile');
    return profileService.getCurrentProfile();
  },
  async setOnboardingCompleteForUser(userId, complete) {
    const { setOnboardingCompleteForUser } = await import('@/lib/onboarding/completion-storage');
    return setOnboardingCompleteForUser(userId, complete);
  },
  async getOnboardingCompleteForUser(userId) {
    const { getOnboardingCompleteForUser } = await import('@/lib/onboarding/completion-storage');
    return getOnboardingCompleteForUser(userId);
  },
};

/**
 * Resolves where an authenticated user should go.
 * Supabase profile is the source of truth; AsyncStorage is a per-user cache only.
 * Incomplete or missing profiles resume at step-4, never the anonymous intro.
 */
export async function resolveAuthenticatedOnboardingGate(
  userId: string,
  deps: AuthenticatedOnboardingGateDeps = defaultAuthenticatedOnboardingGateDeps,
): Promise<AuthenticatedOnboardingGateDestination> {
  const profileResult = await deps.getCurrentProfile();

  if (profileResult.ok) {
    const profile = profileResult.value;
    const complete = isProfileComplete(profile);
    await deps.setOnboardingCompleteForUser(userId, complete);

    if (complete) {
      return 'home';
    }

    return 'onboarding-step-4';
  }

  const cached = await deps.getOnboardingCompleteForUser(userId);
  if (cached === true) {
    return 'home';
  }

  return 'onboarding-step-4';
}

export async function resolveAppGate(input: {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  getPendingSignupVerification: () => Promise<{ email: string } | null>;
  persistPendingConsent?: ResolveAppGateConsentDeps['persistPendingConsent'];
  hasActiveCurrentConsent?: ResolveAppGateConsentDeps['hasActiveCurrentConsent'];
  authenticatedOnboardingGateDeps?: AuthenticatedOnboardingGateDeps;
}): Promise<AppGateResult> {
  if (!input.isAuthenticated || !input.userId) {
    return resolveUnauthenticatedAppGate({
      isReady: input.isReady,
      pendingVerificationEmail: (await input.getPendingSignupVerification())?.email,
    });
  }

  if (!input.isReady) {
    return { destination: 'loading' };
  }

  if (!input.persistPendingConsent || !input.hasActiveCurrentConsent) {
    return { destination: 'authenticated-health-data-consent' };
  }

  const consentDestination = await resolveHealthDataConsentGate({
    userId: input.userId,
    persistPendingConsent: input.persistPendingConsent,
    hasActiveCurrentConsent: input.hasActiveCurrentConsent,
  });
  if (consentDestination === 'authenticated-health-data-consent') {
    return { destination: 'authenticated-health-data-consent' };
  }

  const destination = await resolveAuthenticatedOnboardingGate(
    input.userId,
    input.authenticatedOnboardingGateDeps,
  );
  return { destination };
}
