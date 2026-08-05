import {
  ACTIVITY_SCORES,
  AGE_ADJUSTED_WEIGHTS,
  BODY_COMPOSITION_WEIGHTS,
  FINAL_SCORE_WEIGHTS,
  HEALTH_SCORE_VERSION,
} from './health-score.constants';
import type {
  HealthScoreEngineResult,
  HealthScoreInput,
  HealthScoreResult,
} from './health-score.types';
import {
  adjustBodyFatPctForScoring,
  applyCalibrationScoreCaps,
  buildHealthScoreExplanation,
  calculateAgeYears,
  calculateBmi,
  calculateWhtr,
  clamp,
  classifyBmi,
  classifyBodyFat,
  classifyWhtr,
  resolveBodyFatPct,
  roundToInteger,
  scoreAgeAdjustedBodyFat,
  scoreAgeAdjustedWhtr,
  scoreBmi,
  scoreBodyFat,
  scoreWhtr,
  validateHealthScoreInput,
} from './health-score.utils';

export function calculateHealthScore(input: HealthScoreInput): HealthScoreEngineResult {
  const validationError = validateHealthScoreInput(input);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const ageYears = calculateAgeYears(input.dateOfBirth, input.asOfDate);
  const bmi = calculateBmi(input.weightKg, input.heightCm);
  const whtr = calculateWhtr(input.waistCm, input.heightCm);
  const { bodyFatPct: rawBodyFatPct, method } = resolveBodyFatPct(input, bmi, ageYears);

  if (!Number.isFinite(rawBodyFatPct) || rawBodyFatPct < 0 || rawBodyFatPct > 75) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Body fat percentage could not be calculated from the provided measurements.',
      },
    };
  }

  const scoringBodyFatPct = adjustBodyFatPctForScoring(rawBodyFatPct, method);
  const bmiScore = scoreBmi(bmi);
  const whtrScore = scoreWhtr(whtr);
  const bodyFatScore = scoreBodyFat(scoringBodyFatPct, input.gender);

  const bodyComposition = roundToInteger(
    BODY_COMPOSITION_WEIGHTS.bmi * bmiScore +
      BODY_COMPOSITION_WEIGHTS.whtr * whtrScore +
      BODY_COMPOSITION_WEIGHTS.bodyFat * bodyFatScore,
  );

  const activity = ACTIVITY_SCORES[input.activityLevel];

  const ageAdjustedBodyFatScore = scoreAgeAdjustedBodyFat(rawBodyFatPct, ageYears, input.gender);
  const ageAdjustedWhtrScore = scoreAgeAdjustedWhtr(whtr, ageYears);

  const ageAdjustedHealth = roundToInteger(
    AGE_ADJUSTED_WEIGHTS.bodyFat * ageAdjustedBodyFatScore +
      AGE_ADJUSTED_WEIGHTS.whtr * ageAdjustedWhtrScore,
  );

  const bands = {
    bmiCategory: classifyBmi(bmi),
    whtrRisk: classifyWhtr(whtr),
    bodyFatCategory: classifyBodyFat(rawBodyFatPct, input.gender),
  };

  const metrics = {
    ageYears,
    bmi: roundMetric(bmi),
    whtr: roundMetric(whtr),
    bodyFatPct: roundMetric(rawBodyFatPct),
    bodyFatMethod: method,
  };

  const uncappedScore = roundToInteger(
    clamp(
      FINAL_SCORE_WEIGHTS.bodyComposition * bodyComposition +
        FINAL_SCORE_WEIGHTS.activity * activity +
        FINAL_SCORE_WEIGHTS.ageAdjustedHealth * ageAdjustedHealth,
      0,
      100,
    ),
  );

  const score = applyCalibrationScoreCaps(uncappedScore, input, metrics, bands);

  const explanation = buildHealthScoreExplanation({
    bmi: bmiScore,
    whtr: whtrScore,
    body_fat: bodyFatScore,
    activity,
    age_adjusted_body_fat: ageAdjustedBodyFatScore,
    age_adjusted_whtr: ageAdjustedWhtrScore,
  });

  const result: HealthScoreResult = {
    score,
    scoreVersion: HEALTH_SCORE_VERSION,
    subscores: {
      bodyComposition,
      activity,
      ageAdjustedHealth,
    },
    metrics,
    bands,
    explanation,
    computedAt: input.asOfDate,
  };

  return { ok: true, value: result };
}

function roundMetric(value: number): number {
  return Math.round(value * 1000) / 1000;
}
