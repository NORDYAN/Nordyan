import type { AppError } from '@/lib/core';
import { isProfileComplete, type UserProfile } from '@/lib/domain/profile';
import { setOnboardingCompleteForUser } from '@/lib/onboarding/completion-storage';
import {
  clearPendingProfileMeasurements,
  getPendingProfileMeasurements,
} from '@/lib/onboarding/pending-profile-storage';
import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import { profileService } from '@/lib/services/profile/profile.service';
import { createHealthSnapshotFromProfile } from '@/lib/services/snapshots';

export type SyncPendingProfileReason =
  | 'missing_pending'
  | 'unauthenticated'
  | 'incomplete_profile'
  | 'sync_failed';

export type SyncPendingProfileResult =
  | { ok: true; profile: UserProfile }
  | { ok: false; reason: SyncPendingProfileReason; error?: AppError };

async function resolveProfileForSync(userId: string): Promise<
  | { ok: true; profile: UserProfile }
  | { ok: false; reason: SyncPendingProfileReason; error?: AppError }
> {
  const pending = await getPendingProfileMeasurements();

  if (pending) {
    const result = await profileService.completeOnboarding(pending);
    if (!result.ok) {
      return { ok: false, reason: 'sync_failed', error: result.error };
    }

    if (!isProfileComplete(result.value)) {
      return { ok: false, reason: 'incomplete_profile' };
    }

    await clearPendingProfileMeasurements();
    return { ok: true, profile: result.value };
  }

  const existingResult = await profileService.getCurrentProfile();
  if (!existingResult.ok) {
    return { ok: false, reason: 'sync_failed', error: existingResult.error };
  }

  if (!existingResult.value || !isProfileComplete(existingResult.value)) {
    return { ok: false, reason: 'missing_pending' };
  }

  return { ok: true, profile: existingResult.value };
}

/**
 * After sign-in/sign-up (and step 5 when authenticated),
 * persist pending onboarding measurements to the user's Supabase profile.
 * Snapshot creation is best-effort and must not block onboarding completion.
 */
export async function syncPendingProfileAfterAuth(): Promise<SyncPendingProfileResult> {
  const userResult = await supabaseAuthRepository.getCurrentUser();
  if (!userResult.ok) {
    return { ok: false, reason: 'sync_failed', error: userResult.error };
  }

  if (!userResult.value) {
    return { ok: false, reason: 'unauthenticated' };
  }

  const profileResult = await resolveProfileForSync(userResult.value.id);
  if (!profileResult.ok) {
    return profileResult;
  }

  const snapshotResult = await createHealthSnapshotFromProfile(
    profileResult.profile,
    'onboarding',
  );
  if (!snapshotResult.ok) {
    if (__DEV__) {
      console.warn('[sync-pending-profile] snapshot failed', snapshotResult.error);
    }
  }

  await setOnboardingCompleteForUser(userResult.value.id, true);

  return { ok: true, profile: profileResult.profile };
}
