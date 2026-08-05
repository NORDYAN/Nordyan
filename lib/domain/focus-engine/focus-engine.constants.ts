export const FOCUS_ENGINE_VERSION = '1.0.0';

/** Calibration-complete release status. */
export const FOCUS_ENGINE_STATUS = 'frozen' as const;

/** Drivers at or above this score are treated as non-actionable strengths. */
export const FOCUS_STRONG_DRIVER_THRESHOLD = 82;

/** Overall score threshold to consider a maintain recommendation. */
export const FOCUS_MAINTAIN_MIN_SCORE = 85;

/** Minimum strong drivers (of six) required alongside score for maintain. */
export const FOCUS_MAINTAIN_STRONG_DRIVER_COUNT = 4;

/** Reference score used to estimate realistic upside (not perfection). */
export const FOCUS_IMPROVEMENT_REFERENCE_SCORE = 75;

/** Minimum aggregated weighted opportunity to recommend action over maintain. */
export const FOCUS_MIN_ACTION_OPPORTUNITY = 1.75;

/** Relative tie threshold when comparing focus opportunities. */
export const FOCUS_TIE_RELATIVE_THRESHOLD = 0.08;

export const FOCUS_MAX_EXPECTED_GAIN = 6;
export const FOCUS_MIN_EXPECTED_GAIN = 1;

/** Conservative waist reduction used when simulating WHtR gains (cm). */
export const FOCUS_WAIST_REDUCTION_CM = 2.5;

/** Conservative driver-score uplift caps used in gain simulation. */
export const FOCUS_GAIN_SIMULATION = {
  activityStepScores: [35, 50, 68, 82, 92] as const,
  whtrDriverUplift: 12,
  bodyFatDriverUplift: 10,
  bmiDriverUplift: 8,
  ageAdjustedDriverUplift: 8,
  maintainGain: 0,
} as const;

export const FOCUS_CONFIDENCE = {
  base: 0.55,
  maxGapBonus: 0.25,
  maxSupportBonus: 0.15,
  completenessBonus: 0.05,
  maintainStrongBonus: 0.1,
} as const;

export const FOCUS_PRIORITY_GAIN_THRESHOLDS = {
  high: 4,
  medium: 2,
} as const;

/** Deterministic tie-break order among focus types. */
export const FOCUS_TYPE_TIEBREAK_ORDER = [
  'reduce_waist',
  'improve_body_composition',
  'improve_activity',
  'improve_weight_balance',
  'maintain_current_path',
] as const;

export const FOCUS_HEALTHY_WHTR_FOR_ATHLETIC_BMI = 0.48;
