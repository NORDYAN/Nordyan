import type { Result } from '@/lib/core';
import {
  isCurrentHealthDataConsentGrant,
  type HealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';
import {
  initialLifestyleAnswersValidator,
  type InitialLifestyleAnswers,
} from '@/lib/domain/initial-lifestyle';
import type { ProfileMeasurements } from '@/lib/domain/profile';

export type AnonymousSignupBaselineDeps = {
  getUnownedPendingInitialLifestyle: () => Promise<Result<InitialLifestyleAnswers | null>>;
  hasPendingAgeConfirmation: () => Promise<boolean>;
  getUnownedPendingHealthDataConsent: () => Promise<HealthDataConsentGrant | null>;
  getUnownedPendingProfileMeasurements: () => Promise<ProfileMeasurements | null>;
};

async function defaultAnonymousSignupBaselineDeps(): Promise<AnonymousSignupBaselineDeps> {
  const [
    { getPendingInitialLifestyle },
    { hasPendingAgeConfirmation },
    { getPendingHealthDataConsent },
    { getPendingProfileMeasurements },
  ] = await Promise.all([
    import('@/lib/onboarding/pending-initial-lifestyle-storage'),
    import('@/lib/onboarding/pending-age-confirmation-storage'),
    import('@/lib/onboarding/pending-health-data-consent-storage'),
    import('@/lib/onboarding/pending-profile-storage'),
  ]);

  return {
    getUnownedPendingInitialLifestyle: getPendingInitialLifestyle,
    hasPendingAgeConfirmation,
    getUnownedPendingHealthDataConsent: getPendingHealthDataConsent,
    getUnownedPendingProfileMeasurements: getPendingProfileMeasurements,
  };
}

/**
 * Pre-auth signup is allowed only when the anonymous Kom igång bundle is present.
 * Uses unowned pending slots so UUID-bound drafts are not treated as a new signup,
 * and so wrong-email release back to anonymous remains valid.
 */
export async function hasRequiredAnonymousSignupBaseline(
  deps?: AnonymousSignupBaselineDeps,
): Promise<boolean> {
  const resolved = deps ?? (await defaultAnonymousSignupBaselineDeps());
  const lifestyle = await resolved.getUnownedPendingInitialLifestyle();
  if (!lifestyle.ok || lifestyle.value === null) {
    return false;
  }

  if (!initialLifestyleAnswersValidator.validate(lifestyle.value).valid) {
    return false;
  }

  if (!(await resolved.hasPendingAgeConfirmation())) {
    return false;
  }

  if (!isCurrentHealthDataConsentGrant(await resolved.getUnownedPendingHealthDataConsent())) {
    return false;
  }

  return (await resolved.getUnownedPendingProfileMeasurements()) !== null;
}
