/**
 * Weekly Check-in / Veckokoll — self-reported weekly context.
 * Not Health Score, Focus, Plan, Measurement, or device data.
 */

/** Constrained 1–5 subjective scale. Polarity is per field, not universal. */
export type WeeklyCheckInScale = 1 | 2 | 3 | 4 | 5;

export type WeeklyCheckInTrainingFrequency =
  | 'none'
  | 'once'
  | 'twice'
  | 'three'
  | 'four_plus';

export type WeeklyCheckInAlcoholConsumption =
  | 'none'
  | '1_3'
  | '4_7'
  | '8_14'
  | '15_plus';

export type WeeklyCheckInPolarity = 'higher_better' | 'higher_worse';

export type WeeklyCheckInScaleField =
  | 'sleepQuality'
  | 'energy'
  | 'stress'
  | 'everydayActivity'
  | 'eatingQuality'
  | 'planAdherence';

export type WeeklyCheckInBucketField = 'trainingFrequency' | 'alcoholConsumption';

export type WeeklyCheckInAnswerField = WeeklyCheckInScaleField | WeeklyCheckInBucketField;

/** All eight answers required before Save. */
export type WeeklyCheckInAnswers = {
  sleepQuality: WeeklyCheckInScale;
  energy: WeeklyCheckInScale;
  stress: WeeklyCheckInScale;
  trainingFrequency: WeeklyCheckInTrainingFrequency;
  everydayActivity: WeeklyCheckInScale;
  eatingQuality: WeeklyCheckInScale;
  alcoholConsumption: WeeklyCheckInAlcoholConsumption;
  planAdherence: WeeklyCheckInScale;
};

/**
 * Persisted-shape domain record.
 * weekStartDate is the local Monday (YYYY-MM-DD).
 */
export type WeeklyCheckIn = {
  id: string;
  userId: string;
  weekStartDate: string;
  sleepQuality: WeeklyCheckInScale;
  energy: WeeklyCheckInScale;
  stress: WeeklyCheckInScale;
  trainingFrequency: WeeklyCheckInTrainingFrequency;
  everydayActivity: WeeklyCheckInScale;
  eatingQuality: WeeklyCheckInScale;
  alcoholConsumption: WeeklyCheckInAlcoholConsumption;
  planAdherence: WeeklyCheckInScale;
  createdAt: string;
  updatedAt: string;
};

export const WEEKLY_CHECK_IN_SCALE_MIN = 1;
export const WEEKLY_CHECK_IN_SCALE_MAX = 5;

export const WEEKLY_CHECK_IN_TRAINING_FREQUENCIES = [
  'none',
  'once',
  'twice',
  'three',
  'four_plus',
] as const satisfies readonly WeeklyCheckInTrainingFrequency[];

export const WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS = [
  'none',
  '1_3',
  '4_7',
  '8_14',
  '15_plus',
] as const satisfies readonly WeeklyCheckInAlcoholConsumption[];

export const WEEKLY_CHECK_IN_ANSWER_FIELDS = [
  'sleepQuality',
  'energy',
  'stress',
  'trainingFrequency',
  'everydayActivity',
  'eatingQuality',
  'alcoholConsumption',
  'planAdherence',
] as const satisfies readonly WeeklyCheckInAnswerField[];

export const WEEKLY_CHECK_IN_SCALE_FIELDS = [
  'sleepQuality',
  'energy',
  'stress',
  'everydayActivity',
  'eatingQuality',
  'planAdherence',
] as const satisfies readonly WeeklyCheckInScaleField[];
