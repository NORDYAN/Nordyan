import { CALIBRATION_SCORING, FINAL_SCORE_WEIGHTS } from './health-score.constants';
import {
  hasObesityMetricContradiction as evaluateObesityMetricContradiction,
  isRuntimeAnthropometricEdgeCase,
} from './health-score.utils';
import type { HealthScoreSuccessTestVector } from './health-score.test-vectors';
import { healthScoreSuccessTestVectors } from './health-score.test-vectors';
import type { HealthScoreGender, HealthScoreResult, HealthScoreValidationError } from './health-score.types';

export type CalibrationAssertionId =
  | 'obese_score_cap'
  | 'anthropometric_edge_score_cap'
  | 'sedentary_prevents_perfect_score'
  | 'age_adjustment_lift_cap';

export type CalibrationAssertionViolation = {
  assertionId: CalibrationAssertionId;
  vectorId: string;
  message: string;
  details: Record<string, number | string | boolean>;
};

export const CALIBRATION_THRESHOLDS = {
  obeseScoreCap: CALIBRATION_SCORING.obeseScoreCap,
  nearPerfectScore: 90,
  sedentaryPerfectScore: 99,
  maxAgeAdjustmentLift: 8,
  neutralAgeAdjustedScore: 68,
  lowWhtrOutlier: CALIBRATION_SCORING.lowWhtrDiminishStart,
  lowBodyFatOutlier: CALIBRATION_SCORING.navyBodyFatOutlierFloorPct,
  highBmiObesity: 30,
  healthyWhtrForObesityContradiction: CALIBRATION_SCORING.healthyWhtrForObesityContradiction,
  severeUnderweightMaxScore: CALIBRATION_SCORING.severeUnderweightMaxScore,
} as const;

type ObesityContradiction = {
  contradictsBmi: boolean;
  reasons: string[];
};

export function hasObesityMetricContradiction(
  result: HealthScoreResult,
  gender: HealthScoreGender,
): ObesityContradiction {
  const reasons: string[] = [];
  const { whtr, bodyFatPct } = result.metrics;
  const { bodyFatCategory } = result.bands;
  const contradictsBmi = evaluateObesityMetricContradiction(gender, result.metrics, result.bands);

  if (whtr < CALIBRATION_THRESHOLDS.healthyWhtrForObesityContradiction) {
    reasons.push('healthy_whtr');
  }

  if (bodyFatCategory === 'athlete') {
    reasons.push('athletic_body_fat');
  }

  if (
    (gender === 'male' && bodyFatPct <= 13) ||
    (gender === 'female' && bodyFatPct <= 20) ||
    (gender === 'other' && bodyFatPct <= 18)
  ) {
    reasons.push('athletic_body_fat_threshold');
  }

  return {
    contradictsBmi,
    reasons,
  };
}

export function calculateScoreWithoutAgeContext(result: HealthScoreResult): number {
  return Math.round(
    FINAL_SCORE_WEIGHTS.bodyComposition * result.subscores.bodyComposition +
      FINAL_SCORE_WEIGHTS.activity * result.subscores.activity +
      FINAL_SCORE_WEIGHTS.ageAdjustedHealth * CALIBRATION_THRESHOLDS.neutralAgeAdjustedScore,
  );
}

export function calculateAgeAdjustmentLift(result: HealthScoreResult): number {
  return result.score - calculateScoreWithoutAgeContext(result);
}

export function isAnthropometricEdgeCase(vector: HealthScoreSuccessTestVector): boolean {
  return isRuntimeAnthropometricEdgeCase(vector.input, vector.expected.metrics);
}

export function evaluateCalibrationAssertions(
  vector: HealthScoreSuccessTestVector,
): CalibrationAssertionViolation[] {
  const violations: CalibrationAssertionViolation[] = [];
  const { expected, input, id } = vector;
  const ageLift = calculateAgeAdjustmentLift(expected);
  const obesityContradiction = hasObesityMetricContradiction(expected, input.gender);

  if (
    expected.bands.bmiCategory === 'obesity' &&
    expected.score > CALIBRATION_THRESHOLDS.obeseScoreCap &&
    !obesityContradiction.contradictsBmi
  ) {
    violations.push({
      assertionId: 'obese_score_cap',
      vectorId: id,
      message:
        'Obese BMI profiles should not exceed 69 unless waist/body fat clearly contradict BMI.',
      details: {
        score: expected.score,
        bmi: expected.metrics.bmi,
        whtr: expected.metrics.whtr,
        bodyFatPct: expected.metrics.bodyFatPct,
        contradictsBmi: obesityContradiction.contradictsBmi,
      },
    });
  }

  if (
    isAnthropometricEdgeCase(vector) &&
    expected.score >= CALIBRATION_THRESHOLDS.nearPerfectScore
  ) {
    violations.push({
      assertionId: 'anthropometric_edge_score_cap',
      vectorId: id,
      message:
        'Extreme anthropometric edge cases should not automatically produce near-perfect overall scores.',
      details: {
        score: expected.score,
        heightCm: input.heightCm,
        weightKg: input.weightKg,
        bmi: expected.metrics.bmi,
        whtr: expected.metrics.whtr,
        bodyFatPct: expected.metrics.bodyFatPct,
      },
    });
  }

  if (
    input.activityLevel === 'sedentary' &&
    expected.score >= CALIBRATION_THRESHOLDS.sedentaryPerfectScore
  ) {
    violations.push({
      assertionId: 'sedentary_prevents_perfect_score',
      vectorId: id,
      message: 'Sedentary activity must prevent a near-perfect overall score.',
      details: {
        score: expected.score,
        activityScore: expected.subscores.activity,
      },
    });
  }

  if (ageLift > CALIBRATION_THRESHOLDS.maxAgeAdjustmentLift) {
    violations.push({
      assertionId: 'age_adjustment_lift_cap',
      vectorId: id,
      message:
        'Age adjustment must not increase the final score by more than 8 points versus neutral age context.',
      details: {
        score: expected.score,
        scoreWithoutAgeContext: calculateScoreWithoutAgeContext(expected),
        ageLift,
        ageAdjustedHealth: expected.subscores.ageAdjustedHealth,
      },
    });
  }

  return violations;
}

export function runCalibrationReview(): CalibrationAssertionViolation[] {
  return healthScoreSuccessTestVectors.flatMap((vector) => evaluateCalibrationAssertions(vector));
}

export type CalibrationReviewRow = {
  id: string;
  age: number;
  gender: string;
  bmi: number;
  whtr: number;
  bodyFatPct: number;
  bodyComposition: number;
  activity: number;
  ageAdjustedHealth: number;
  score: number;
  biggestOpportunity: string;
  primaryDriver: string;
  ageLift: number;
};

export function buildCalibrationReviewTable(): CalibrationReviewRow[] {
  return healthScoreSuccessTestVectors.map((vector) => ({
    id: vector.id,
    age: vector.expected.metrics.ageYears,
    gender: vector.input.gender,
    bmi: vector.expected.metrics.bmi,
    whtr: vector.expected.metrics.whtr,
    bodyFatPct: vector.expected.metrics.bodyFatPct,
    bodyComposition: vector.expected.subscores.bodyComposition,
    activity: vector.expected.subscores.activity,
    ageAdjustedHealth: vector.expected.subscores.ageAdjustedHealth,
    score: vector.expected.score,
    biggestOpportunity: vector.expected.explanation.biggestOpportunity,
    primaryDriver: vector.expected.explanation.primaryDriver,
    ageLift: calculateAgeAdjustmentLift(vector.expected),
  }));
}

export type CalibrationReviewSummary = {
  rows: CalibrationReviewRow[];
  violations: CalibrationAssertionViolation[];
  suspiciousVectors: Array<{
    vectorId: string;
    reasons: string[];
    violations: CalibrationAssertionViolation[];
  }>;
};

export function buildCalibrationReviewSummary(): CalibrationReviewSummary {
  const rows = buildCalibrationReviewTable();
  const violations = runCalibrationReview();

  const suspiciousById = new Map<
    string,
    { reasons: string[]; violations: CalibrationAssertionViolation[] }
  >();

  for (const row of rows) {
    const manualReasons: string[] = [];

    if (row.bmi >= 25 && row.bodyFatPct <= 15 && row.score >= 84) {
      manualReasons.push('High BMI with low body fat produces a very high score.');
    }

    if (row.whtr <= CALIBRATION_THRESHOLDS.lowWhtrOutlier && row.score >= 90) {
      manualReasons.push('Extremely low WHtR produces a near-perfect score.');
    }

    if (row.age >= 65 && row.score >= 85) {
      manualReasons.push('Older adult receives an unusually high overall score.');
    }

    if (row.bmi >= CALIBRATION_THRESHOLDS.highBmiObesity && row.score > 69) {
      manualReasons.push('Obese BMI category with overall score above 69.');
    }

    if (row.bmi <= 18.5 && row.score >= 80) {
      manualReasons.push('Underweight BMI with a high overall score.');
    }

    if (manualReasons.length > 0) {
      suspiciousById.set(row.id, {
        reasons: manualReasons,
        violations: [],
      });
    }
  }

  for (const violation of violations) {
    const existing = suspiciousById.get(violation.vectorId) ?? {
      reasons: [],
      violations: [],
    };

    existing.violations.push(violation);
    suspiciousById.set(violation.vectorId, existing);
  }

  return {
    rows,
    violations,
    suspiciousVectors: [...suspiciousById.entries()].map(([vectorId, value]) => ({
      vectorId,
      reasons: value.reasons,
      violations: value.violations,
    })),
  };
}

export type CalibrationAssertionResult =
  | { ok: true }
  | { ok: false; violations: CalibrationAssertionViolation[] };

export function assertCalibrationInvariants(
  vectors: HealthScoreSuccessTestVector[] = healthScoreSuccessTestVectors,
): CalibrationAssertionResult {
  const violations = vectors.flatMap((vector) => evaluateCalibrationAssertions(vector));

  if (violations.length > 0) {
    return { ok: false, violations };
  }

  return { ok: true };
}

export function formatCalibrationValidationError(
  error: HealthScoreValidationError,
): string {
  return `${error.code}: ${error.message}`;
}
