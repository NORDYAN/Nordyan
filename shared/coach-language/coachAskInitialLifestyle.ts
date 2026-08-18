/**
 * Coach Ask v1.3 — allowlisted onboarding Initial Lifestyle baseline projection.
 * Distinct from Weekly Check-in. Not a raw domain/DB record. No IDs or timestamps.
 * Scale meanings reuse the v1.2 Weekly Check-in tables so sources stay comparable.
 */

import {
  COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
  COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS,
  COACH_ASK_EATING_QUALITY_MEANINGS,
  COACH_ASK_ENERGY_MEANINGS,
  COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
  COACH_ASK_SLEEP_QUALITY_MEANINGS,
  COACH_ASK_STRESS_MEANINGS,
  type CoachAskEatingQualityMeaning,
  type CoachAskEnergyMeaning,
  type CoachAskEverydayActivityMeaning,
  type CoachAskSleepQualityMeaning,
  type CoachAskStressMeaning,
  type CoachAskWeeklyCheckInAlcoholEntry,
  type CoachAskWeeklyCheckInScaleEntry,
} from './coachAskWeeklyCheckIn';

export const COACH_ASK_INITIAL_LIFESTYLE_SOURCE = 'onboarding_baseline_self_report' as const;

export const COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_VALUES = [
  'never',
  'once',
  'two_three',
  'four_six',
  'daily',
] as const;

export const COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS = {
  never: 'never',
  once: 'once_per_typical_week',
  two_three: 'two_to_three_times_per_typical_week',
  four_six: 'four_to_six_times_per_typical_week',
  daily: 'daily',
} as const;

export const COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND =
  'neutral_self_reported_frequency' as const;

export type CoachAskLessHealthyFoodFrequencyValue =
  (typeof COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_VALUES)[number];
export type CoachAskLessHealthyFoodFrequencyMeaning =
  (typeof COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS)[CoachAskLessHealthyFoodFrequencyValue];

export type CoachAskLessHealthyFoodFrequencyEntry = {
  value: CoachAskLessHealthyFoodFrequencyValue;
  meaning: CoachAskLessHealthyFoodFrequencyMeaning;
  kind: typeof COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND;
};

export type CoachAskInitialLifestyle = {
  source: typeof COACH_ASK_INITIAL_LIFESTYLE_SOURCE;
  sleepQuality: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskSleepQualityMeaning>;
  energy: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskEnergyMeaning>;
  stress: CoachAskWeeklyCheckInScaleEntry<'higher_worse', CoachAskStressMeaning>;
  /** null on legacy rows that predate the nutrition-frequency question. */
  lessHealthyFoodFrequency: CoachAskLessHealthyFoodFrequencyEntry | null;
  everydayActivity: CoachAskWeeklyCheckInScaleEntry<
    'higher_better',
    CoachAskEverydayActivityMeaning
  >;
  eatingQuality: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskEatingQualityMeaning>;
  alcoholConsumption: CoachAskWeeklyCheckInAlcoholEntry;
};

export const COACH_ASK_INITIAL_LIFESTYLE_OBJECT_KEYS = [
  'source',
  'sleepQuality',
  'energy',
  'stress',
  'lessHealthyFoodFrequency',
  'everydayActivity',
  'eatingQuality',
  'alcoholConsumption',
] as const;

export function isCoachAskLessHealthyFoodFrequencyValue(
  value: unknown,
): value is CoachAskLessHealthyFoodFrequencyValue {
  return (
    typeof value === 'string' &&
    (COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_VALUES as readonly string[]).includes(value)
  );
}
