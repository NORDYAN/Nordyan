import type { ProfileActivityLevel, ProfileGender } from '@/lib/domain/profile';
import { isWritableProfileGender } from '@/lib/domain/profile';

export const HEALTH_PROFILE_DATE_OF_BIRTH_INPUT = 'date-picker' as const;

export const healthProfilePersonalFields = {
  dateOfBirth: {
    input: HEALTH_PROFILE_DATE_OF_BIRTH_INPUT,
    stacked: true,
  },
  height: {
    input: 'measurement' as const,
    stacked: true,
  },
} as const;

export function canSaveHealthProfilePersonalFields(input: {
  dateOfBirthValid: boolean;
  heightValid: boolean;
  gender: ProfileGender | null;
  activityLevel: ProfileActivityLevel | null;
}): boolean {
  return (
    input.dateOfBirthValid &&
    input.heightValid &&
    isWritableProfileGender(input.gender) &&
    input.activityLevel !== null
  );
}
