import {
  bindPendingInitialLifestyleToUser,
  clearPendingInitialLifestyleForUser,
  clearUnownedPendingInitialLifestyle,
  getPendingLifestyleBindState,
} from './pending-initial-lifestyle-storage';
import {
  bindPendingOnboardingOwnership,
  clearCompletedOnboardingLocalData as clearCompletedOnboardingLocalDataService,
  clearUnownedPendingOnboarding,
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
 * Existing-account sign-in is not proof that anonymous onboarding data belongs
 * to that account. Discard only unbound data; another user's bound retry data
 * remains isolated and untouched.
 */
export async function clearUnownedPendingOnboardingForExistingSignIn(): Promise<void> {
  await clearUnownedPendingOnboarding(ownershipDeps);
}

/**
 * "Kom igång" starts a distinct anonymous attempt. Clear only the anonymous
 * slots; UUID-bound retries and pending-verification ownership stay intact.
 */
export async function startNewAnonymousOnboarding(): Promise<void> {
  await clearUnownedPendingOnboarding(ownershipDeps);
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
