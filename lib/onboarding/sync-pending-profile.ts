import type { AppError, Result } from '@/lib/core';
import { isProfileComplete, type ProfileMeasurements, type UserProfile } from '@/lib/domain/profile';

export type SyncPendingProfileReason =
  | 'missing_pending'
  | 'unauthenticated'
  | 'incomplete_profile'
  | 'sync_failed';

export type SyncPendingProfileResult =
  | {
      ok: true;
      profile: UserProfile;
      persistedPending: boolean;
      snapshotCreated: boolean;
    }
  | { ok: false; reason: SyncPendingProfileReason; error?: AppError };

export type SyncPendingProfileDeps = {
  getCurrentUser: () => Promise<Result<{ id: string } | null>>;
  getPendingProfileMeasurements: (userId: string) => Promise<ProfileMeasurements | null>;
  clearPendingProfileMeasurements: (userId: string) => Promise<void>;
  completeOnboarding: (measurements: ProfileMeasurements) => Promise<Result<UserProfile>>;
  getCurrentProfile: () => Promise<Result<UserProfile | null>>;
  createOnboardingSnapshot: (profile: UserProfile) => Promise<Result<unknown>>;
  setOnboardingCompleteForUser: (userId: string, complete: boolean) => Promise<void>;
};

async function resolveProfileForSync(
  userId: string,
  deps: SyncPendingProfileDeps,
): Promise<
  | { ok: true; profile: UserProfile; persistedPending: boolean }
  | { ok: false; reason: SyncPendingProfileReason; error?: AppError }
> {
  const pending = await deps.getPendingProfileMeasurements(userId);

  if (pending) {
    const result = await deps.completeOnboarding(pending);
    if (!result.ok) {
      return { ok: false, reason: 'sync_failed', error: result.error };
    }

    if (!isProfileComplete(result.value)) {
      return { ok: false, reason: 'incomplete_profile' };
    }

    await deps.clearPendingProfileMeasurements(userId);
    return { ok: true, profile: result.value, persistedPending: true };
  }

  const existingResult = await deps.getCurrentProfile();
  if (!existingResult.ok) {
    return { ok: false, reason: 'sync_failed', error: existingResult.error };
  }

  if (!existingResult.value || !isProfileComplete(existingResult.value)) {
    return { ok: false, reason: 'missing_pending' };
  }

  return { ok: true, profile: existingResult.value, persistedPending: false };
}

/**
 * After sign-in/verified callback (and step 5 when authenticated),
 * persist pending onboarding measurements to the user's Supabase profile.
 * An onboarding snapshot is created only when pending data was persisted in this call.
 */
export async function runSyncPendingProfile(
  deps: SyncPendingProfileDeps,
): Promise<SyncPendingProfileResult> {
  const userResult = await deps.getCurrentUser();
  if (!userResult.ok) {
    return { ok: false, reason: 'sync_failed', error: userResult.error };
  }

  if (!userResult.value) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const profileResult = await resolveProfileForSync(userResult.value.id, deps);
  if (!profileResult.ok) {
    return profileResult;
  }

  let snapshotCreated = false;
  if (profileResult.persistedPending) {
    const snapshotResult = await deps.createOnboardingSnapshot(profileResult.profile);
    if (snapshotResult.ok) {
      snapshotCreated = true;
    } else if (__DEV__) {
      console.warn('[sync-pending-profile] snapshot failed', snapshotResult.error);
    }
  }

  await deps.setOnboardingCompleteForUser(userResult.value.id, true);

  return {
    ok: true,
    profile: profileResult.profile,
    persistedPending: profileResult.persistedPending,
    snapshotCreated,
  };
}