import type { ProfileActivityLevel, ProfileGender } from './types';

export type ProfileFieldOption<T extends string> = {
  label: string;
  value: T;
};

export const PROFILE_GENDER_OPTIONS: readonly ProfileFieldOption<ProfileGender>[] = [
  { label: 'Man', value: 'male' },
  { label: 'Kvinna', value: 'female' },
  { label: 'Annat / vill inte ange', value: 'other' },
];

export const PROFILE_ACTIVITY_LEVEL_OPTIONS: readonly ProfileFieldOption<ProfileActivityLevel>[] =
  [
    { label: 'Mest stillasittande', value: 'sedentary' },
    { label: 'Lätt aktiv', value: 'lightly_active' },
    { label: 'Måttligt aktiv', value: 'moderately_active' },
    { label: 'Mycket aktiv', value: 'very_active' },
    { label: 'Elitidrottare', value: 'extra_active' },
  ];
