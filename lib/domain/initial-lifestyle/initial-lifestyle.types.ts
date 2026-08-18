/**
 * Initial Lifestyle Check — self-reported typical / normal lifestyle baseline.
 *
 * Distinct from Weekly Check-in:
 * - Initial Lifestyle: "What is your normal lifestyle baseline?"
 * - Weekly Check-in: "What happened this week?"
 *
 * This domain owns its own types. Do not import WeeklyCheckInAnswers.
 * No planAdherence: the user has not yet had an established NORDYAN Plan.
 * No trainingFrequency: activity is collected as profile.activityLevel.
 * Not Health Score, Focus, Plan, Measurement, snapshot, or device data.
 */

/** Constrained 1–5 subjective scale. Polarity is per field, not universal. */
export type InitialLifestyleScale = 1 | 2 | 3 | 4 | 5;

/**
 * Typical weekly frequency of fast food, snacks, sweets, or similar choices.
 * Distinct from eatingQuality (subjective overall assessment).
 */
export type InitialLifestyleLessHealthyFoodFrequency =
  | 'never'
  | 'once'
  | 'two_three'
  | 'four_six'
  | 'daily';

/** Self-reported typical alcohol consumption during a normal week. */
export type InitialLifestyleAlcoholConsumption =
  | 'none'
  | '1_3'
  | '4_7'
  | '8_14'
  | '15_plus';

export type InitialLifestylePolarity = 'higher_better' | 'higher_worse';

export type InitialLifestyleScaleField =
  | 'sleepQuality'
  | 'energy'
  | 'stress'
  | 'everydayActivity'
  | 'eatingQuality';

export type InitialLifestyleBucketField =
  | 'lessHealthyFoodFrequency'
  | 'alcoholConsumption';

export type InitialLifestyleAnswerField =
  | InitialLifestyleScaleField
  | InitialLifestyleBucketField;

/** All seven answers required for a complete Initial Lifestyle Check. */
export type InitialLifestyleAnswers = {
  sleepQuality: InitialLifestyleScale;
  energy: InitialLifestyleScale;
  stress: InitialLifestyleScale;
  lessHealthyFoodFrequency: InitialLifestyleLessHealthyFoodFrequency;
  everydayActivity: InitialLifestyleScale;
  eatingQuality: InitialLifestyleScale;
  alcoholConsumption: InitialLifestyleAlcoholConsumption;
};

/**
 * Persisted-shape domain record.
 * No week identity. Skip is represented by the absence of this record,
 * not by null answers.
 *
 * lessHealthyFoodFrequency may be null only on legacy rows created before
 * the nutrition-frequency question existed. New submissions still require it.
 */
export type InitialLifestyleCheck = {
  id: string;
  userId: string;
  sleepQuality: InitialLifestyleScale;
  energy: InitialLifestyleScale;
  stress: InitialLifestyleScale;
  lessHealthyFoodFrequency: InitialLifestyleLessHealthyFoodFrequency | null;
  everydayActivity: InitialLifestyleScale;
  eatingQuality: InitialLifestyleScale;
  alcoholConsumption: InitialLifestyleAlcoholConsumption;
  createdAt: string;
  updatedAt: string;
};

export const INITIAL_LIFESTYLE_SCALE_MIN = 1;
export const INITIAL_LIFESTYLE_SCALE_MAX = 5;

export const INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES = [
  'never',
  'once',
  'two_three',
  'four_six',
  'daily',
] as const satisfies readonly InitialLifestyleLessHealthyFoodFrequency[];

export const INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS = [
  'none',
  '1_3',
  '4_7',
  '8_14',
  '15_plus',
] as const satisfies readonly InitialLifestyleAlcoholConsumption[];

export const INITIAL_LIFESTYLE_ANSWER_FIELDS = [
  'sleepQuality',
  'energy',
  'stress',
  'lessHealthyFoodFrequency',
  'everydayActivity',
  'eatingQuality',
  'alcoholConsumption',
] as const satisfies readonly InitialLifestyleAnswerField[];

export const INITIAL_LIFESTYLE_SCALE_FIELDS = [
  'sleepQuality',
  'energy',
  'stress',
  'everydayActivity',
  'eatingQuality',
] as const satisfies readonly InitialLifestyleScaleField[];
