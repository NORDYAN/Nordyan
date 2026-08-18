import { setOnboardingCompleteForUser } from '@/lib/onboarding/completion-storage';
import {
  clearPendingProfileMeasurementsForUser,
  getPendingProfileMeasurementsForUser,
} from '@/lib/onboarding/pending-profile-storage';
import {
  runSyncPendingProfile,
  type SyncPendingProfileDeps,
  type SyncPendingProfileResult,
} from '@/lib/onboarding/sync-pending-profile';
import { supabaseAuthRepository } from '@/lib/repositories/supabase-auth.repository';
import { profileService } from '@/lib/services/profile';
import { createHealthSnapshotFromProfile } from '@/lib/services/snapshots';

const defaultSyncPendingProfileDeps: SyncPendingProfileDeps = {
  getCurrentUser: () => supabaseAuthRepository.getCurrentUser(),
  getPendingProfileMeasurements: getPendingProfileMeasurementsForUser,
  clearPendingProfileMeasurements: clearPendingProfileMeasurementsForUser,
  completeOnboarding: (measurements) => profileService.completeOnboarding(measurements),
  getCurrentProfile: () => profileService.getCurrentProfile(),
  createOnboardingSnapshot: (profile) =>
    createHealthSnapshotFromProfile(profile, 'onboarding'),
  setOnboardingCompleteForUser,
};

export function syncPendingProfileAfterAuth(): Promise<SyncPendingProfileResult> {
  return runSyncPendingProfile(defaultSyncPendingProfileDeps);
}