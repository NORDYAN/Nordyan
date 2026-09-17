import {
  bindPendingInitialLifestyleToUser,
  clearPendingInitialLifestyleForUser,
  clearUnownedPendingInitialLifestyle,
  getPendingLifestyleBindState,
  releasePendingInitialLifestyleBinding,
} from './pending-initial-lifestyle-storage';
import {
  bindPendingOnboardingOwnership,
  clearCompletedOnboardingLocalData as clearCompletedOnboardingLocalDataService,
  clearUnownedPendingOnboarding,
  releasePendingOnboardingFromOwner as releasePendingOnboardingFromOwnerService,
  type BindPendingOnboardingResult,
  type PendingOnboardingOwnershipDeps,
} from './pending-onboarding-ownership.service';
import {
  bindPendingProfileMeasurementsToUser,
  clearPendingProfileMeasurementsForUser,
  clearUnownedPendingProfileMeasurements,
  getPendingProfileBindState,
  releasePendingProfileMeasurementsBinding,
} from './pending-profile-storage';
import { clearUnownedPendingAgeConfirmation } from './pending-age-confirmation-storage';
import { clearUnownedPendingHealthDataConsent } from './pending-health-data-consent-storage';
import { clearPendingNotificationChoice } from './pending-notification-choice-storage';
import { clearPendingSignupVerification } from './pending-signup-verification-storage';
import { beginNewAnonymousOnboardingAttempt } from './anonymous-onboarding-attempt';

const ownershipDeps: PendingOnboardingOwnershipDeps = {
  getProfileBindState: getPendingProfileBindState,
  getLifestyleBindState: getPendingLifestyleBindState,
  bindProfile: bindPendingProfileMeasurementsToUser,
  bindLifestyle: bindPendingInitialLifestyleToUser,
  releaseProfileBinding: releasePendingProfileMeasurementsBinding,
  clearUnownedProfile: clearUnownedPendingProfileMeasurements,
  clearUnownedLifestyle: clearUnownedPendingInitialLifestyle,
};

/**
 * A successful Supabase signup supplies the stable auth user UUID that owns
 * the pre-auth onboarding bundle. Existing bound data can never be rebound.
 */
export async function bindPendingOnboardingToUser(
  userId: string,
): Promise<BindPendingOnboardingResult> {
  return bindPendingOnboardingOwnership(userId, ownershipDeps);
}

/**
 * Wrong-email recovery: unbind this device's pending onboarding from an
 * unverified signup UUID back to anonymous. Age confirmation and Health Data
 * Consent are not UUID-bound at this stage and are left intact.
 */
export async function releasePendingOnboardingFromOwner(ownerId: string): Promise<void> {
  return releasePendingOnboardingFromOwnerService(ownerId, {
    releaseProfileBinding: releasePendingProfileMeasurementsBinding,
    releaseLifestyleBinding: releasePendingInitialLifestyleBinding,
  });
}

/**
 * Existing-account sign-in is not proof that anonymous onboarding data belongs
 * to that account. Discard only unbound data; another user's bound retry data
 * remains isolated and untouched.
 */
export async function clearUnownedPendingOnboardingForExistingSignIn(): Promise<void> {
  await clearUnownedPendingOnboarding(ownershipDeps);
  await clearUnownedPendingHealthDataConsent();
  await clearUnownedPendingAgeConfirmation();
  await clearPendingNotificationChoice();
}

/**
 * "Kom igång" starts a distinct anonymous attempt. Clear only the anonymous
 * slots; UUID-bound retries and pending-verification ownership stay intact.
 */
export async function startNewAnonymousOnboarding(): Promise<void> {
  await clearUnownedPendingOnboarding(ownershipDeps);
  await clearUnownedPendingHealthDataConsent();
  await clearUnownedPendingAgeConfirmation();
  await clearPendingNotificationChoice();
  beginNewAnonymousOnboardingAttempt();
}

/**
 * Successful persistence finished this device's onboarding draft for `userId`.
 * Another UUID's bound retry bundle is not removed.
 */
export async function clearCompletedOnboardingLocalData(userId: string): Promise<void> {
  await clearCompletedOnboardingLocalDataService(userId, {
    ...ownershipDeps,
    clearProfileForUser: clearPendingProfileMeasurementsForUser,
    clearLifestyleForUser: clearPendingInitialLifestyleForUser,
  });
  await clearPendingSignupVerification();
}

/**
 * Logout from the authenticated app drops only this UUID's leftover bound
 * draft. Another account's retry bundle and unowned anonymous drafts remain.
 */
export async function clearCurrentUserPendingOnboardingLeftover(
  userId: string,
): Promise<void> {
  await Promise.all([
    clearPendingProfileMeasurementsForUser(userId),
    clearPendingInitialLifestyleForUser(userId),
  ]);
}

export type { BindPendingOnboardingResult };
