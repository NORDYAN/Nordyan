/**
 * Coach Ask v1.2 — allowlisted current-week Weekly Check-in projection.
 * Not a raw domain/DB record. No IDs, timestamps, or weekStartDate.
 */

export const COACH_ASK_WEEKLY_CHECK_IN_SOURCE = 'current_week_self_report' as const;

export const COACH_ASK_WEEKLY_CHECK_IN_SCALE_VALUES = [1, 2, 3, 4, 5] as const;
export type CoachAskWeeklyCheckInScaleValue =
  (typeof COACH_ASK_WEEKLY_CHECK_IN_SCALE_VALUES)[number];

export type CoachAskWeeklyCheckInPolarity = 'higher_better' | 'higher_worse';

export const COACH_ASK_SLEEP_QUALITY_MEANINGS = {
  1: 'very_poor',
  2: 'poor',
  3: 'okay',
  4: 'good',
  5: 'very_good',
} as const;

export const COACH_ASK_ENERGY_MEANINGS = {
  1: 'very_low',
  2: 'low',
  3: 'normal',
  4: 'high',
  5: 'very_high',
} as const;

/** Stress amount. 5 = very_high stress (worse). Never a quality label. */
export const COACH_ASK_STRESS_MEANINGS = {
  1: 'none',
  2: 'low',
  3: 'moderate',
  4: 'high',
  5: 'very_high',
} as const;

export const COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS = {
  1: 'almost_none',
  2: 'low',
  3: 'moderate',
  4: 'quite_active',
  5: 'very_active',
} as const;

export const COACH_ASK_EATING_QUALITY_MEANINGS = {
  1: 'very_poor',
  2: 'poor',
  3: 'okay',
  4: 'good',
  5: 'very_good',
} as const;

export const COACH_ASK_PLAN_ADHERENCE_MEANINGS = {
  1: 'not_at_all',
  2: 'poor',
  3: 'okay',
  4: 'good',
  5: 'very_good',
} as const;

export const COACH_ASK_TRAINING_FREQUENCY_VALUES = [
  'none',
  'once',
  'twice',
  'three',
  'four_plus',
] as const;

export const COACH_ASK_TRAINING_FREQUENCY_MEANINGS = {
  none: 'no_sessions',
  once: 'one_session',
  twice: 'two_sessions',
  three: 'three_sessions',
  four_plus: 'four_or_more_sessions',
} as const;

export const COACH_ASK_TRAINING_FREQUENCY_KIND = 'self_reported_session_count' as const;

export const COACH_ASK_ALCOHOL_CONSUMPTION_VALUES = [
  'none',
  '1_3',
  '4_7',
  '8_14',
  '15_plus',
] as const;

export const COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS = {
  none: 'no_drinks',
  '1_3': 'one_to_three_drinks',
  '4_7': 'four_to_seven_drinks',
  '8_14': 'eight_to_fourteen_drinks',
  '15_plus': 'fifteen_or_more_drinks',
} as const;

export const COACH_ASK_ALCOHOL_CONSUMPTION_KIND = 'neutral_self_reported_bucket' as const;

export type CoachAskSleepQualityMeaning =
  (typeof COACH_ASK_SLEEP_QUALITY_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskEnergyMeaning =
  (typeof COACH_ASK_ENERGY_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskStressMeaning =
  (typeof COACH_ASK_STRESS_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskEverydayActivityMeaning =
  (typeof COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskEatingQualityMeaning =
  (typeof COACH_ASK_EATING_QUALITY_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskPlanAdherenceMeaning =
  (typeof COACH_ASK_PLAN_ADHERENCE_MEANINGS)[CoachAskWeeklyCheckInScaleValue];
export type CoachAskTrainingFrequencyValue =
  (typeof COACH_ASK_TRAINING_FREQUENCY_VALUES)[number];
export type CoachAskTrainingFrequencyMeaning =
  (typeof COACH_ASK_TRAINING_FREQUENCY_MEANINGS)[CoachAskTrainingFrequencyValue];
export type CoachAskAlcoholConsumptionValue =
  (typeof COACH_ASK_ALCOHOL_CONSUMPTION_VALUES)[number];
export type CoachAskAlcoholConsumptionMeaning =
  (typeof COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS)[CoachAskAlcoholConsumptionValue];

export type CoachAskWeeklyCheckInScaleEntry<
  Polarity extends CoachAskWeeklyCheckInPolarity,
  Meaning extends string,
> = {
  value: CoachAskWeeklyCheckInScaleValue;
  polarity: Polarity;
  meaning: Meaning;
};

export type CoachAskWeeklyCheckInTrainingEntry = {
  value: CoachAskTrainingFrequencyValue;
  meaning: CoachAskTrainingFrequencyMeaning;
  kind: typeof COACH_ASK_TRAINING_FREQUENCY_KIND;
};

export type CoachAskWeeklyCheckInAlcoholEntry = {
  value: CoachAskAlcoholConsumptionValue;
  meaning: CoachAskAlcoholConsumptionMeaning;
  kind: typeof COACH_ASK_ALCOHOL_CONSUMPTION_KIND;
};

export type CoachAskWeeklyCheckIn = {
  source: typeof COACH_ASK_WEEKLY_CHECK_IN_SOURCE;
  sleepQuality: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskSleepQualityMeaning>;
  energy: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskEnergyMeaning>;
  stress: CoachAskWeeklyCheckInScaleEntry<'higher_worse', CoachAskStressMeaning>;
  trainingFrequency: CoachAskWeeklyCheckInTrainingEntry;
  everydayActivity: CoachAskWeeklyCheckInScaleEntry<
    'higher_better',
    CoachAskEverydayActivityMeaning
  >;
  eatingQuality: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskEatingQualityMeaning>;
  alcoholConsumption: CoachAskWeeklyCheckInAlcoholEntry;
  planAdherence: CoachAskWeeklyCheckInScaleEntry<'higher_better', CoachAskPlanAdherenceMeaning>;
};

export const COACH_ASK_WEEKLY_CHECK_IN_OBJECT_KEYS = [
  'source',
  'sleepQuality',
  'energy',
  'stress',
  'trainingFrequency',
  'everydayActivity',
  'eatingQuality',
  'alcoholConsumption',
  'planAdherence',
] as const;

export const COACH_ASK_WEEKLY_CHECK_IN_SCALE_ENTRY_KEYS = ['value', 'polarity', 'meaning'] as const;
export const COACH_ASK_WEEKLY_CHECK_IN_BUCKET_ENTRY_KEYS = ['value', 'meaning', 'kind'] as const;

export function isCoachAskWeeklyCheckInScaleValue(
  value: unknown,
): value is CoachAskWeeklyCheckInScaleValue {
  return (
    typeof value === 'number' &&
    (COACH_ASK_WEEKLY_CHECK_IN_SCALE_VALUES as readonly number[]).includes(value)
  );
}

export function isCoachAskTrainingFrequencyValue(
  value: unknown,
): value is CoachAskTrainingFrequencyValue {
  return (
    typeof value === 'string' &&
    (COACH_ASK_TRAINING_FREQUENCY_VALUES as readonly string[]).includes(value)
  );
}

export function isCoachAskAlcoholConsumptionValue(
  value: unknown,
): value is CoachAskAlcoholConsumptionValue {
  return (
    typeof value === 'string' &&
    (COACH_ASK_ALCOHOL_CONSUMPTION_VALUES as readonly string[]).includes(value)
  );
}
