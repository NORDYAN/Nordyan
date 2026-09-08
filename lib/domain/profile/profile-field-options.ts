import type { ProfileActivityLevel, ProfileGender } from './types';
import { liveArray, t } from '@/lib/i18n';

export type ProfileFieldOption<T extends string> = {
  label: string;
  value: T;
};

export const PROFILE_GENDER_VALUES = ['male', 'female'] as const;
export type WritableProfileGender = (typeof PROFILE_GENDER_VALUES)[number];

export function isWritableProfileGender(
  value: ProfileGender | null | undefined,
): value is WritableProfileGender {
  return value === 'male' || value === 'female';
}

export function getProfileGenderOptions(): readonly ProfileFieldOption<WritableProfileGender>[] {
  return [
    { label: t('profile.gender.male'), value: 'male' },
    { label: t('profile.gender.female'), value: 'female' },
  ];
}

export const PROFILE_GENDER_OPTIONS: readonly ProfileFieldOption<WritableProfileGender>[] = liveArray(
  getProfileGenderOptions,
);

export const PROFILE_ACTIVITY_LEVEL_VALUES = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
] as const;

export function getProfileActivityLevelOptions(): readonly ProfileFieldOption<ProfileActivityLevel>[] {
  return [
    { label: t('profile.activity.sedentary'), value: 'sedentary' },
    { label: t('profile.activity.lightly_active'), value: 'lightly_active' },
    { label: t('profile.activity.moderately_active'), value: 'moderately_active' },
    { label: t('profile.activity.very_active'), value: 'very_active' },
    { label: t('profile.activity.extra_active'), value: 'extra_active' },
  ];
}

export const PROFILE_ACTIVITY_LEVEL_OPTIONS: readonly ProfileFieldOption<ProfileActivityLevel>[] =
  liveArray(getProfileActivityLevelOptions);
