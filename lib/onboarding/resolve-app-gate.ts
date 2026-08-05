import { hasProfileMeasurements, isProfileComplete } from '@/lib/domain/profile';
import {
  getOnboardingCompleteForUser,
  setOnboardingCompleteForUser,
} from '@/lib/onboarding/completion-storage';
import { profileService } from '@/lib/services/profile/profile.service';

export type OnboardingGateDestination = 'sign-in' | 'onboarding' | 'onboarding-step-4' | 'home';

/**
 * Resolves where an authenticated user should go.
 * Supabase profile is the source of truth; AsyncStorage is a per-user cache only.
 */
export async function resolveAuthenticatedOnboardingGate(
  userId: string,
): Promise<'onboarding' | 'onboarding-step-4' | 'home'> {
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
}): Promise<OnboardingGateDestination | 'loading'> {
  if (!input.isReady) {
    return 'loading';
  }

  if (!input.isAuthenticated || !input.userId) {
    return 'sign-in';
  }

  return resolveAuthenticatedOnboardingGate(input.userId);
}
