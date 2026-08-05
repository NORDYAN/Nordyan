import type { HealthScoreActivityLevel, HealthScoreGender } from './health-score.types';

export const HEALTH_SCORE_VERSION = '1.0.0';

/** Calibration-complete release status. */
export const HEALTH_SCORE_ENGINE_STATUS = 'frozen' as const;

export const FINAL_SCORE_WEIGHTS = {
  bodyComposition: 0.55,
  activity: 0.25,
  ageAdjustedHealth: 0.2,
} as const;

export const BODY_COMPOSITION_WEIGHTS = {
  bmi: 0.25,
  whtr: 0.4,
  bodyFat: 0.35,
} as const;

export const AGE_ADJUSTED_WEIGHTS = {
  bodyFat: 0.6,
  whtr: 0.4,
} as const;

export const INPUT_LIMITS = {
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 35, max: 250 },
  waistCm: { min: 40, max: 200 },
  neckCm: { min: 20, max: 60 },
  hipCm: { min: 40, max: 200 },
} as const;

export const ACTIVITY_SCORES: Record<HealthScoreActivityLevel, number> = {
  sedentary: 35,
  light: 50,
  moderate: 68,
  active: 82,
  very_active: 92,
};

/** Neutral reference point for explanation deltas — matches moderate activity. */
export const EXPLANATION_NEUTRAL_SCORE = ACTIVITY_SCORES.moderate;

export const WHTR_PLATEAUS = [
  { max: 0.42, scoreMin: 95, scoreMax: 100 },
  { max: 0.48, scoreMin: 80, scoreMax: 94 },
  { max: 0.52, scoreMin: 65, scoreMax: 79 },
  { max: 0.58, scoreMin: 45, scoreMax: 64 },
  { max: 0.65, scoreMin: 25, scoreMax: 44 },
  { max: Infinity, scoreMin: 10, scoreMax: 24 },
] as const;

export const BMI_PLATEAUS = [
  { max: 16.0, scoreMin: 30, scoreMax: 45 },
  { max: 17.0, scoreMin: 45, scoreMax: 55 },
  { max: 18.4, scoreMin: 55, scoreMax: 68 },
  { max: 22.0, scoreMin: 90, scoreMax: 100 },
  { max: 24.9, scoreMin: 75, scoreMax: 89 },
  { max: 27.9, scoreMin: 55, scoreMax: 74 },
  { max: 29.9, scoreMin: 40, scoreMax: 54 },
  { max: 34.9, scoreMin: 25, scoreMax: 39 },
  { max: Infinity, scoreMin: 10, scoreMax: 24 },
] as const;

export const BODY_FAT_PLATEAUS: Record<
  HealthScoreGender,
  readonly { max: number; scoreMin: number; scoreMax: number }[]
> = {
  male: [
    { max: 13, scoreMin: 95, scoreMax: 100 },
    { max: 17, scoreMin: 85, scoreMax: 94 },
    { max: 24, scoreMin: 70, scoreMax: 84 },
    { max: 29, scoreMin: 45, scoreMax: 69 },
    { max: Infinity, scoreMin: 10, scoreMax: 44 },
  ],
  female: [
    { max: 20, scoreMin: 95, scoreMax: 100 },
    { max: 24, scoreMin: 85, scoreMax: 94 },
    { max: 31, scoreMin: 70, scoreMax: 84 },
    { max: 36, scoreMin: 45, scoreMax: 69 },
    { max: Infinity, scoreMin: 10, scoreMax: 44 },
  ],
  other: [
    { max: 18, scoreMin: 95, scoreMax: 100 },
    { max: 22, scoreMin: 85, scoreMax: 94 },
    { max: 28, scoreMin: 70, scoreMax: 84 },
    { max: 33, scoreMin: 45, scoreMax: 69 },
    { max: Infinity, scoreMin: 10, scoreMax: 44 },
  ],
};

export const BODY_FAT_REFERENCE_MIDPOINTS: Record<
  HealthScoreGender,
  readonly { minAge: number; midpoint: number }[]
> = {
  male: [
    { minAge: 20, midpoint: 17 },
    { minAge: 30, midpoint: 20 },
    { minAge: 40, midpoint: 22 },
    { minAge: 50, midpoint: 24 },
    { minAge: 60, midpoint: 26 },
  ],
  female: [
    { minAge: 20, midpoint: 25 },
    { minAge: 30, midpoint: 28 },
    { minAge: 40, midpoint: 30 },
    { minAge: 50, midpoint: 32 },
    { minAge: 60, midpoint: 34 },
  ],
  other: [
    { minAge: 20, midpoint: 21 },
    { minAge: 30, midpoint: 24 },
    { minAge: 40, midpoint: 26 },
    { minAge: 50, midpoint: 28 },
    { minAge: 60, midpoint: 30 },
  ],
};

export const WHTR_AGE_RELAXATION = {
  minAge: 60,
  thresholdShift: 0.02,
} as const;

export const CM_PER_INCH = 2.54;

export const US_NAVY_COEFFICIENTS = {
  male: {
    waistNeckLog: 86.01,
    heightLog: 70.041,
    constant: 36.76,
  },
  female: {
    sumLog: 163.205,
    heightLog: 97.684,
    constant: 78.387,
  },
} as const;

export const DEURENBERG_COEFFICIENTS = {
  bmi: 1.2,
  age: 0.23,
  sexMale: 10.8,
  constant: 5.4,
} as const;

export const CALIBRATION_SCORING = {
  navyBodyFatOutlierFloorPct: 8,
  navyBodyFatScoringMinimumPct: 14,
  lowWhtrDiminishStart: 0.35,
  lowWhtrDiminishFloor: 0.25,
  lowWhtrMaxScore: 88,
  anthropometricEdgeMaxScore: 89,
  severeUnderweightBmi: 16,
  severeUnderweightMaxScore: 75,
  obeseScoreCap: 69,
  healthyWhtrForObesityContradiction: 0.48,
} as const;
