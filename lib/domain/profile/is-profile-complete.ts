import type { UserProfile } from '@/lib/domain/profile/types';
import type { HealthSnapshot } from '@/lib/domain/snapshot';

function hasPersonalProfileFields(profile: UserProfile): boolean {
  return (
    typeof profile.dateOfBirth === 'string' &&
    profile.dateOfBirth.length > 0 &&
    typeof profile.heightCm === 'number' &&
    profile.heightCm > 0 &&
    (profile.gender === 'male' ||
      profile.gender === 'female' ||
      profile.gender === 'other') &&
    (profile.activityLevel === 'sedentary' ||
      profile.activityLevel === 'lightly_active' ||
      profile.activityLevel === 'moderately_active' ||
      profile.activityLevel === 'very_active' ||
      profile.activityLevel === 'extra_active')
  );
}

function hasInitialBodyWeight(profile: UserProfile): boolean {
  return typeof profile.weightKg === 'number' && profile.weightKg > 0;
}

/** Waist and neck are collected via onboarding body measurements or Health → New Measurement. */
export function hasBodyCircumferenceMeasurements(profile: UserProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  return (
    typeof profile.waistCm === 'number' &&
    profile.waistCm > 0 &&
    typeof profile.neckCm === 'number' &&
    profile.neckCm > 0
  );
}

function hasRegisteredWaistCircumference(profile: UserProfile): boolean {
  return typeof profile.waistCm === 'number' && profile.waistCm > 0;
}

function hasRegisteredNeckCircumference(profile: UserProfile): boolean {
  return typeof profile.neckCm === 'number' && profile.neckCm > 0;
}

/** Home follow-up card: shown until the first body measurement registration is completed. */
export function shouldShowBodyMeasurementFollowUp(
  profile: UserProfile | null | undefined,
  latestSnapshot: HealthSnapshot | null | undefined,
): boolean {
  if (!profile) {
    return false;
  }

  if (latestSnapshot?.snapshotReason === 'measurement') {
    return false;
  }

  if (hasBodyCircumferenceMeasurements(profile)) {
    return false;
  }

  return !hasRegisteredWaistCircumference(profile) && !hasRegisteredNeckCircumference(profile);
}

/** Personal profile + initial body weight collected during onboarding. */
export function hasProfileMeasurements(profile: UserProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  return hasPersonalProfileFields(profile) && hasInitialBodyWeight(profile);
}

/**
 * Onboarding is complete when personal profile fields and initial weight are present.
 * Waist and neck are not required.
 */
export function isProfileComplete(profile: UserProfile | null | undefined): boolean {
  if (!profile) {
    return false;
  }

  return hasProfileMeasurements(profile);
}
