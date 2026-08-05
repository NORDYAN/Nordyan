import { HEALTH_SCORE_VERSION } from './health-score.constants';

export { HEALTH_SCORE_VERSION };

export type HealthScoreGender = 'male' | 'female' | 'other';

export type HealthScoreActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obesity';

export type WhtrRisk = 'low' | 'moderate' | 'elevated' | 'high';

export type BodyFatCategory = 'athlete' | 'fitness' | 'average' | 'high' | 'very_high';

export type BodyFatMethod = 'us_navy' | 'deurenberg';

export type HealthScoreDriverMetric =
  | 'bmi'
  | 'whtr'
  | 'body_fat'
  | 'activity'
  | 'age_adjusted_body_fat'
  | 'age_adjusted_whtr';

export type HealthScoreDriverScores = {
  bmi: number;
  whtr: number;
  body_fat: number;
  activity: number;
  age_adjusted_body_fat: number;
  age_adjusted_whtr: number;
};

export type HealthScoreExplanation = {
  biggestStrength: HealthScoreDriverMetric;
  biggestOpportunity: HealthScoreDriverMetric;
  primaryDriver: HealthScoreDriverMetric;
};

export type HealthScoreInput = {
  dateOfBirth: string;
  gender: HealthScoreGender;
  heightCm: number;
  weightKg: number;
  waistCm: number;
  neckCm: number;
  hipCm?: number;
  activityLevel: HealthScoreActivityLevel;
  /** ISO date used for age calculation — required for deterministic output. */
  asOfDate: string;
};

export type HealthScoreSubscores = {
  bodyComposition: number;
  activity: number;
  ageAdjustedHealth: number;
};

export type HealthScoreMetrics = {
  ageYears: number;
  bmi: number;
  whtr: number;
  bodyFatPct: number;
  bodyFatMethod: BodyFatMethod;
};

export type HealthScoreBands = {
  bmiCategory: BmiCategory;
  whtrRisk: WhtrRisk;
  bodyFatCategory: BodyFatCategory;
};

export type HealthScoreResult = {
  score: number;
  scoreVersion: typeof HEALTH_SCORE_VERSION;
  subscores: HealthScoreSubscores;
  metrics: HealthScoreMetrics;
  bands: HealthScoreBands;
  explanation: HealthScoreExplanation;
  /** Echoes input.asOfDate — never generated inside the engine. */
  computedAt: string;
};

export type HealthScoreValidationError = {
  code: 'VALIDATION';
  message: string;
};

export type HealthScoreEngineResult =
  | { ok: true; value: HealthScoreResult }
  | { ok: false; error: HealthScoreValidationError };
