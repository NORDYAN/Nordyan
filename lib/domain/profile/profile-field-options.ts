import type { ProfileActivityLevel, ProfileGender } from './types';
import { liveArray, t } from '@/lib/i18n';

export type ProfileFieldOption<T extends string> = {
  label: string;
  value: T;
};

export const PROFILE_GENDER_VALUES = ['male', 'female', 'other'] as const;

export function getProfileGenderOptions(): readonly ProfileFieldOption<ProfileGender>[] {
  return [
    { label: t('profile.gender.male'), value: 'male' },
    { label: t('profile.gender.female'), value: 'female' },
    { label: t('profile.gender.other'), value: 'other' },
  ];
}

export const PROFILE_GENDER_OPTIONS: readonly ProfileFieldOption<ProfileGender>[] = liveArray(
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
