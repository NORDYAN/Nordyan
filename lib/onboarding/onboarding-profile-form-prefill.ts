import type { ProfileActivityLevel, ProfileGender, ProfileMeasurements } from '@/lib/domain/profile';

export type OnboardingProfileFormPrefill = {
  dateOfBirth: string;
  height: string;
  weight: string;
  gender: ProfileGender | null;
  activityLevel: ProfileActivityLevel | null;
};

export const EMPTY_ONBOARDING_PROFILE_FORM_PREFILL: OnboardingProfileFormPrefill = {
  dateOfBirth: '',
  height: '',
  weight: '',
  gender: null,
  activityLevel: null,
};

type AuthenticatedProfilePrefill = {
  dateOfBirth?: string | null;
  heightCm?: number | null;
  weightKg?: number | null;
  gender?: ProfileGender | null;
  activityLevel?: ProfileActivityLevel | null;
};

function measurementField(value: number | null | undefined): string {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    return String(value);
  }

  return '';
}

function fromSource(
  source: AuthenticatedProfilePrefill | ProfileMeasurements,
): OnboardingProfileFormPrefill {
  return {
    dateOfBirth: source.dateOfBirth ? source.dateOfBirth.slice(0, 10) : '',
    height: measurementField(source.heightCm),
    weight: measurementField(source.weightKg),
    gender: source.gender ?? null,
    activityLevel: source.activityLevel ?? null,
  };
}

/**
 * Anonymous onboarding must never inherit a previous account's cached profile.
 * Authenticated incomplete onboarding may fall back to that user's Supabase profile.
 */
export function resolveOnboardingProfileFormPrefill(input: {
  pending: ProfileMeasurements | null;
  authenticatedProfile: AuthenticatedProfilePrefill | null;
  userId: string | null;
}): OnboardingProfileFormPrefill {
  if (input.pending) {
    return fromSource(input.pending);
  }

  if (input.userId && input.authenticatedProfile) {
    return fromSource(input.authenticatedProfile);
  }

  return EMPTY_ONBOARDING_PROFILE_FORM_PREFILL;
}
