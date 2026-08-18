import { hasProfileMeasurements, isProfileComplete } from '@/lib/domain/profile';
import {
  getOnboardingCompleteForUser,
  setOnboardingCompleteForUser,
} from '@/lib/onboarding/completion-storage';
import {
  resolveUnauthenticatedAppGate,
  type UnauthenticatedAppGateResult,
} from '@/lib/onboarding/resolve-unauthenticated-app-gate';
import { profileService } from '@/lib/services/profile';

export type AuthenticatedOnboardingGateDestination = 'onboarding' | 'onboarding-step-4' | 'home';

export type OnboardingGateDestination =
  | AuthenticatedOnboardingGateDestination
  | 'check-email';

export type AppGateResult =
  | UnauthenticatedAppGateResult
  | { destination: AuthenticatedOnboardingGateDestination };

/**
 * Resolves where an authenticated user should go.
 * Supabase profile is the source of truth; AsyncStorage is a per-user cache only.
 */
export async function resolveAuthenticatedOnboardingGate(
  userId: string,
): Promise<AuthenticatedOnboardingGateDestination> {
  const profileResult = await profileService.getCurrentProfile();

  if (profileResult.ok) {
    const profile = profileResult.value;
    const complete = isProfileComplete(profile);
    await setOnboardingCompleteForUser(userId, complete);

    if (complete) {
      return 'home';
    }

    if (hasProfileMeasurements(profile)) {
      return 'onboarding-step-4';
    }

    return 'onboarding';
  }

  const cached = await getOnboardingCompleteForUser(userId);
  if (cached === true) {
    return 'home';
  }

  return 'onboarding';
}

export async function resolveAppGate(input: {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  getPendingSignupVerification: () => Promise<{ email: string } | null>;
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

  const destination = await resolveAuthenticatedOnboardingGate(input.userId);
  return { destination };
}
