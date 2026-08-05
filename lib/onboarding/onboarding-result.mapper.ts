import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';
import { resolveDateOfBirth } from '@/lib/repositories/profile-mappers';

export function draftProfileFromMeasurements(
  measurements: ProfileMeasurements,
): UserProfile | null {
  const dateOfBirth = resolveDateOfBirth(measurements);
  if (!dateOfBirth || !measurements.gender || !measurements.activityLevel) {
    return null;
  }

  if (typeof measurements.weightKg !== 'number' || measurements.weightKg <= 0) {
    return null;
  }

  return {
    id: 'onboarding-draft',
    userId: 'onboarding-draft',
    firstName: measurements.firstName ?? null,
    dateOfBirth,
    gender: measurements.gender,
    heightCm: measurements.heightCm,
    weightKg: measurements.weightKg ?? null,
    waistCm: measurements.waistCm ?? null,
    neckCm: measurements.neckCm ?? null,
    activityLevel: measurements.activityLevel,
    goal: measurements.goal ?? null,
    createdAt: '',
    updatedAt: '',
  };
}
