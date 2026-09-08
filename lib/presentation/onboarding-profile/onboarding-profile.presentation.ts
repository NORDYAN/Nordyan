import type { ProfileActivityLevel, ProfileGender } from '@/lib/domain/profile';
import { isWritableProfileGender } from '@/lib/domain/profile';

export const ONBOARDING_PROFILE_DOB_HEIGHT_ARRANGEMENT = 'stack' as const;

export const onboardingProfileDobHeightLayout = {
  arrangement: ONBOARDING_PROFILE_DOB_HEIGHT_ARRANGEMENT,
  dateOfBirthStacked: true,
  heightStacked: true,
} as const;

export function resolveSelectableProfileGender(
  gender: ProfileGender | null | undefined,
): 'male' | 'female' | null {
  return isWritableProfileGender(gender) ? gender : null;
}

export function canContinueOnboardingPersonalProfile(input: {
  dateOfBirthValid: boolean;
  heightValid: boolean;
  weightValid: boolean;
  gender: ProfileGender | null;
  activityLevel: ProfileActivityLevel | null;
}): boolean {
  return (
    input.dateOfBirthValid &&
    input.heightValid &&
    input.weightValid &&
    isWritableProfileGender(input.gender) &&
    input.activityLevel !== null
  );
}
