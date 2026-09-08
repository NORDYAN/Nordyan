import type { FocusType } from '@/lib/domain/focus-engine';
import type { InitialLifestyleLessHealthyFoodFrequency } from '@/lib/domain/initial-lifestyle';
import type { ProfileActivityLevel } from '@/lib/domain/profile';
import type {
  WeeklyCheckInAlcoholConsumption,
  WeeklyCheckInTrainingFrequency,
} from '@/lib/domain/weekly-check-in';

import type { WeeklyFocusArea, WeeklyFocusNeedScore } from './weekly-focus.types';

export const WEEKLY_FOCUS_ENGINE_VERSION = '1.0.0';

export const WEEKLY_FOCUS_AREAS = [
  'everyday_movement',
  'training',
  'sleep',
  'nutrition',
  'alcohol',
  'recovery',
] as const satisfies readonly WeeklyFocusArea[];

/**
 * Improve tie-break after needScore and previous-week continuity.
 * Health Score mapping is applied before this list.
 */
export const WEEKLY_FOCUS_IMPROVE_TIE_PRIORITY = [
  'everyday_movement',
  'sleep',
  'nutrition',
  'training',
  'recovery',
  'alcohol',
] as const satisfies readonly WeeklyFocusArea[];

/** Maintain fill order when fewer than two Improve areas exist. Alcohol is never maintain. */
export const WEEKLY_FOCUS_MAINTAIN_PRIORITY = [
  'everyday_movement',
  'sleep',
  'nutrition',
  'training',
  'recovery',
] as const satisfies readonly Exclude<WeeklyFocusArea, 'alcohol'>[];

/**
 * Last-resort pair when fewer than two evidence-backed areas exist.
 * Matches the profile-complete guarantee (activityLevel always present after onboarding).
 */
export const WEEKLY_FOCUS_INSUFFICIENT_EVIDENCE_FALLBACK = [
  'everyday_movement',
  'training',
] as const satisfies readonly WeeklyFocusArea[];

export const WEEKLY_FOCUS_IMPROVE_MIN_NEED = 3;

export const HIGHER_BETTER_NEED: Record<1 | 2 | 3 | 4 | 5, WeeklyFocusNeedScore> = {
  5: 0,
  4: 1,
  3: 2,
  2: 4,
  1: 5,
};

export const RECOVERY_STRESS_CONTRIBUTION: Record<1 | 2 | 3 | 4 | 5, number> = {
  1: 0,
  2: 1,
  3: 2,
  4: 3,
  5: 4,
};

export const RECOVERY_ENERGY_CONTRIBUTION: Record<1 | 2 | 3 | 4 | 5, number> = {
  5: 0,
  4: 1,
  3: 2,
  2: 3,
  1: 4,
};

export const TRAINING_FREQUENCY_NEED: Record<WeeklyCheckInTrainingFrequency, WeeklyFocusNeedScore> =
  {
    none: 3,
    once: 3,
    twice: 2,
    three: 1,
    four_plus: 0,
  };

export const ACTIVITY_LEVEL_TRAINING_NEED: Record<ProfileActivityLevel, WeeklyFocusNeedScore> = {
  sedentary: 2,
  lightly_active: 2,
  moderately_active: 1,
  very_active: 0,
  extra_active: 0,
};

export const ACTIVITY_LEVEL_MOVEMENT_NEED: Record<ProfileActivityLevel, WeeklyFocusNeedScore> = {
  sedentary: 4,
  lightly_active: 3,
  moderately_active: 2,
  very_active: 1,
  extra_active: 0,
};

export const LESS_HEALTHY_FOOD_NEED: Record<
  InitialLifestyleLessHealthyFoodFrequency,
  WeeklyFocusNeedScore
> = {
  never: 0,
  once: 1,
  two_three: 2,
  four_six: 3,
  daily: 4,
};

export const ALCOHOL_NEED: Record<WeeklyCheckInAlcoholConsumption, WeeklyFocusNeedScore> = {
  none: 0,
  '1_3': 1,
  '4_7': 3,
  '8_14': 4,
  '15_plus': 5,
};

export const ALCOHOL_SELECTABLE_BUCKETS: ReadonlySet<WeeklyCheckInAlcoholConsumption> = new Set([
  '4_7',
  '8_14',
  '15_plus',
]);

/** Soft Improve tie-break only. Empty means no area preference. */
export const PRIMARY_FOCUS_TIE_BREAK: Record<FocusType, readonly WeeklyFocusArea[]> = {
  reduce_waist: ['everyday_movement', 'nutrition'],
  improve_activity: ['everyday_movement', 'training'],
  improve_body_composition: ['training', 'nutrition'],
  improve_weight_balance: ['nutrition', 'everyday_movement'],
  maintain_current_path: [],
};

export const FOCUS_TYPES: readonly FocusType[] = [
  'reduce_waist',
  'improve_activity',
  'improve_body_composition',
  'improve_weight_balance',
  'maintain_current_path',
];
