import type { FocusPriority, FocusRationaleCode, FocusType } from './focus-engine.types';

export type FocusSuccessTestVector = {
  kind: 'success';
  id: string;
  description: string;
  sourceHealthScoreVectorId: string;
  expected: {
    primaryFocus: FocusType;
    secondaryFocus: FocusType | null;
    priority: FocusPriority;
    expectedGainMin: number;
    expectedGainMax: number;
    confidenceMin: number;
    confidenceMax: number;
    rationaleCode: FocusRationaleCode;
    driver: string;
  };
};

export type FocusValidationTestVector = {
  kind: 'validation';
  id: string;
  description: string;
  validationNotes: string;
  input: {
    healthScore: Record<string, unknown>;
    driverScores: Record<string, unknown>;
  };
  expectedErrorMessage: string;
};

export type FocusTestVector = FocusSuccessTestVector | FocusValidationTestVector;

export const focusSuccessTestVectors: FocusSuccessTestVector[] = [
  {
    kind: 'success',
    id: 'focus-lean-young-male-runner',
    description: 'Strong profile returns maintain',
    sourceHealthScoreVectorId: 'lean-young-male-runner',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: 'reduce_waist',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-lean-young-female-yoga',
    description: 'Strong female profile returns maintain',
    sourceHealthScoreVectorId: 'lean-young-female-yoga',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: 'reduce_waist',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'whtr',
    },
  },
  {
    kind: 'success',
    id: 'focus-fit-middle-male',
    description: 'Activity is the primary opportunity',
    sourceHealthScoreVectorId: 'fit-middle-male',
    expected: {
      primaryFocus: 'improve_activity',
      secondaryFocus: null,
      priority: 'high',
      expectedGainMin: 3,
      expectedGainMax: 5,
      confidenceMin: 0.68,
      confidenceMax: 0.85,
      rationaleCode: 'largest_weighted_opportunity',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-average-young-male',
    description: 'Sedentary-leaning male prioritises activity',
    sourceHealthScoreVectorId: 'average-young-male',
    expected: {
      primaryFocus: 'improve_activity',
      secondaryFocus: 'reduce_waist',
      priority: 'high',
      expectedGainMin: 4,
      expectedGainMax: 6,
      confidenceMin: 0.68,
      confidenceMax: 0.85,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-average-middle-female',
    description: 'Body fat is the primary opportunity',
    sourceHealthScoreVectorId: 'average-middle-female',
    expected: {
      primaryFocus: 'improve_body_composition',
      secondaryFocus: 'improve_activity',
      priority: 'medium',
      expectedGainMin: 1,
      expectedGainMax: 3,
      confidenceMin: 0.63,
      confidenceMax: 0.8,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'body_fat',
    },
  },
  {
    kind: 'success',
    id: 'focus-overweight-male-40s',
    description: 'WHtR is the primary opportunity',
    sourceHealthScoreVectorId: 'overweight-male-40s',
    expected: {
      primaryFocus: 'reduce_waist',
      secondaryFocus: 'improve_weight_balance',
      priority: 'medium',
      expectedGainMin: 2,
      expectedGainMax: 4,
      confidenceMin: 0.67,
      confidenceMax: 0.84,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'whtr',
    },
  },
  {
    kind: 'success',
    id: 'focus-overweight-female-50s',
    description: 'Body composition focus for overweight female',
    sourceHealthScoreVectorId: 'overweight-female-50s',
    expected: {
      primaryFocus: 'improve_body_composition',
      secondaryFocus: 'improve_activity',
      priority: 'medium',
      expectedGainMin: 1,
      expectedGainMax: 3,
      confidenceMin: 0.61,
      confidenceMax: 0.78,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'body_fat',
    },
  },
  {
    kind: 'success',
    id: 'focus-obese-male-55',
    description: 'Close tie resolves to body composition',
    sourceHealthScoreVectorId: 'obese-male-55',
    expected: {
      primaryFocus: 'reduce_waist',
      secondaryFocus: 'improve_body_composition',
      priority: 'high',
      expectedGainMin: 2,
      expectedGainMax: 4,
      confidenceMin: 0.46,
      confidenceMax: 0.63,
      rationaleCode: 'central_adiposity_tie_breaker',
      driver: 'whtr',
    },
  },
  {
    kind: 'success',
    id: 'focus-obese-female-60',
    description: 'Obese female prioritises body composition',
    sourceHealthScoreVectorId: 'obese-female-60',
    expected: {
      primaryFocus: 'improve_body_composition',
      secondaryFocus: 'reduce_waist',
      priority: 'medium',
      expectedGainMin: 1,
      expectedGainMax: 3,
      confidenceMin: 0.58,
      confidenceMax: 0.75,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'body_fat',
    },
  },
  {
    kind: 'success',
    id: 'focus-young-sedentary-male',
    description: 'Young sedentary male prioritises activity',
    sourceHealthScoreVectorId: 'young-sedentary-male',
    expected: {
      primaryFocus: 'improve_activity',
      secondaryFocus: 'reduce_waist',
      priority: 'high',
      expectedGainMin: 3,
      expectedGainMax: 5,
      confidenceMin: 0.66,
      confidenceMax: 0.83,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-athletic-male-lifter',
    description: 'Athletic high-BMI male avoids weight-balance focus',
    sourceHealthScoreVectorId: 'athletic-male-lifter',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: null,
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-athletic-female-cyclist',
    description: 'Athletic female maintains current path',
    sourceHealthScoreVectorId: 'athletic-female-cyclist',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: 'reduce_waist',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-edge-athlete-high-bmi',
    description: 'Edge athletic high-BMI profile maintains',
    sourceHealthScoreVectorId: 'edge-athlete-high-bmi',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: null,
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-underweight-young-female',
    description: 'Underweight profile never receives reduce_waist',
    sourceHealthScoreVectorId: 'underweight-young-female',
    expected: {
      primaryFocus: 'improve_weight_balance',
      secondaryFocus: 'improve_activity',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 2,
      confidenceMin: 0.56,
      confidenceMax: 0.73,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'bmi',
    },
  },
  {
    kind: 'success',
    id: 'focus-older-lean-male-65',
    description: 'Older strong profile maintains',
    sourceHealthScoreVectorId: 'older-lean-male-65',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: 'reduce_waist',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'body_fat',
    },
  },
  {
    kind: 'success',
    id: 'focus-middle-high-whtr-male',
    description: 'High WHtR male with activity opportunity',
    sourceHealthScoreVectorId: 'middle-high-whtr-male',
    expected: {
      primaryFocus: 'improve_activity',
      secondaryFocus: 'reduce_waist',
      priority: 'high',
      expectedGainMin: 4,
      expectedGainMax: 6,
      confidenceMin: 0.5,
      confidenceMax: 0.67,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'activity',
    },
  },
  {
    kind: 'success',
    id: 'focus-middle-obese-active-male',
    description: 'Obese active male prioritises waist reduction',
    sourceHealthScoreVectorId: 'middle-obese-active-male',
    expected: {
      primaryFocus: 'reduce_waist',
      secondaryFocus: 'improve_weight_balance',
      priority: 'high',
      expectedGainMin: 2,
      expectedGainMax: 4,
      confidenceMin: 0.65,
      confidenceMax: 0.82,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'whtr',
    },
  },
  {
    kind: 'success',
    id: 'focus-other-gender-moderate',
    description: 'Other gender moderate profile',
    sourceHealthScoreVectorId: 'other-gender-moderate',
    expected: {
      primaryFocus: 'improve_body_composition',
      secondaryFocus: 'improve_activity',
      priority: 'medium',
      expectedGainMin: 1,
      expectedGainMax: 3,
      confidenceMin: 0.7,
      confidenceMax: 0.87,
      rationaleCode: 'engine_primary_opportunity',
      driver: 'body_fat',
    },
  },
  {
    kind: 'success',
    id: 'focus-edge-min-weight',
    description: 'Low-weight edge case with close BMI/activity tie',
    sourceHealthScoreVectorId: 'edge-min-weight',
    expected: {
      primaryFocus: 'improve_weight_balance',
      secondaryFocus: 'improve_activity',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 2,
      confidenceMin: 0.4,
      confidenceMax: 0.57,
      rationaleCode: 'close_tie_breaker',
      driver: 'bmi',
    },
  },
  {
    kind: 'success',
    id: 'focus-young-active-female-no-hip',
    description: 'Strong young female maintains',
    sourceHealthScoreVectorId: 'young-active-female-no-hip',
    expected: {
      primaryFocus: 'maintain_current_path',
      secondaryFocus: 'improve_body_composition',
      priority: 'low',
      expectedGainMin: 0,
      expectedGainMax: 1,
      confidenceMin: 0.78,
      confidenceMax: 0.95,
      rationaleCode: 'maintain_strong_profile',
      driver: 'whtr',
    },
  },
];

export const focusValidationTestVectors: FocusValidationTestVector[] = [
  {
    kind: 'validation',
    id: 'focus-invalid-missing-driver-score',
    description: 'Missing activity driver score',
    validationNotes: 'Activity score is required for weighted focus selection.',
    input: {
      healthScore: {
        score: 71,
        scoreVersion: '1.0.0',
        subscores: { bodyComposition: 67, activity: 68, ageAdjustedHealth: 85 },
        metrics: {
          ageYears: 48,
          bmi: 26.869,
          whtr: 0.527,
          bodyFatPct: 21.686,
          bodyFatMethod: 'us_navy',
        },
        bands: {
          bmiCategory: 'overweight',
          whtrRisk: 'elevated',
          bodyFatCategory: 'average',
        },
        explanation: {
          biggestStrength: 'age_adjusted_body_fat',
          biggestOpportunity: 'whtr',
          primaryDriver: 'age_adjusted_body_fat',
        },
        computedAt: '2026-07-26',
      },
      driverScores: {
        bmi: 62,
        whtr: 54,
        body_fat: 58,
        activity: Number.NaN,
        age_adjusted_body_fat: 85,
        age_adjusted_whtr: 72,
      },
    },
    expectedErrorMessage: 'Driver score for activity is missing or invalid.',
  },
  {
    kind: 'validation',
    id: 'focus-invalid-score-version',
    description: 'Unsupported score version',
    validationNotes: 'Focus engine v1 only accepts score version 1.0.0.',
    input: {
      healthScore: {
        score: 71,
        scoreVersion: '2.0.0',
        subscores: { bodyComposition: 67, activity: 68, ageAdjustedHealth: 85 },
        metrics: {
          ageYears: 48,
          bmi: 26.869,
          whtr: 0.527,
          bodyFatPct: 21.686,
          bodyFatMethod: 'us_navy',
        },
        bands: {
          bmiCategory: 'overweight',
          whtrRisk: 'elevated',
          bodyFatCategory: 'average',
        },
        explanation: {
          biggestStrength: 'age_adjusted_body_fat',
          biggestOpportunity: 'whtr',
          primaryDriver: 'age_adjusted_body_fat',
        },
        computedAt: '2026-07-26',
      },
      driverScores: {
        bmi: 62,
        whtr: 54,
        body_fat: 58,
        activity: 68,
        age_adjusted_body_fat: 85,
        age_adjusted_whtr: 72,
      },
    },
    expectedErrorMessage: 'Unsupported health score version for focus engine v1.',
  },
  {
    kind: 'validation',
    id: 'focus-invalid-incomplete-explanation',
    description: 'Missing explanation fields',
    validationNotes: 'Explanation is required to align with score engine opportunity signals.',
    input: {
      healthScore: {
        score: 71,
        scoreVersion: '1.0.0',
        subscores: { bodyComposition: 67, activity: 68, ageAdjustedHealth: 85 },
        metrics: {
          ageYears: 48,
          bmi: 26.869,
          whtr: 0.527,
          bodyFatPct: 21.686,
          bodyFatMethod: 'us_navy',
        },
        bands: {
          bmiCategory: 'overweight',
          whtrRisk: 'elevated',
          bodyFatCategory: 'average',
        },
        explanation: {
          biggestStrength: 'age_adjusted_body_fat',
        },
        computedAt: '2026-07-26',
      },
      driverScores: {
        bmi: 62,
        whtr: 54,
        body_fat: 58,
        activity: 68,
        age_adjusted_body_fat: 85,
        age_adjusted_whtr: 72,
      },
    },
    expectedErrorMessage: 'Health score explanation, bands, or metrics are incomplete.',
  },
];

export const focusTestVectors: FocusTestVector[] = [
  ...focusSuccessTestVectors,
  ...focusValidationTestVectors,
];
