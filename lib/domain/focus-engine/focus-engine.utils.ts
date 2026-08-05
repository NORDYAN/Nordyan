import {
  ACTIVITY_SCORES,
  AGE_ADJUSTED_WEIGHTS,
  BODY_COMPOSITION_WEIGHTS,
  FINAL_SCORE_WEIGHTS,
} from '@/lib/domain/health-score/health-score.constants';
import type {
  HealthScoreDriverMetric,
  HealthScoreDriverScores,
  HealthScoreInput,
  HealthScoreResult,
} from '@/lib/domain/health-score';
import {
  calculateAgeYears,
  calculateBmi,
  calculateWhtr,
  resolveBodyFatPct,
  scoreAgeAdjustedBodyFat,
  scoreAgeAdjustedWhtr,
  scoreBmi,
  scoreBodyFat,
  scoreWhtr,
} from '@/lib/domain/health-score/health-score.utils';

import {
  FOCUS_GAIN_SIMULATION,
  FOCUS_HEALTHY_WHTR_FOR_ATHLETIC_BMI,
  FOCUS_IMPROVEMENT_REFERENCE_SCORE,
  FOCUS_MAX_EXPECTED_GAIN,
  FOCUS_MIN_ACTION_OPPORTUNITY,
  FOCUS_MIN_EXPECTED_GAIN,
  FOCUS_STRONG_DRIVER_THRESHOLD,
  FOCUS_TIE_RELATIVE_THRESHOLD,
  FOCUS_TYPE_TIEBREAK_ORDER,
} from './focus-engine.constants';
import type {
  FocusCandidate,
  FocusDriverContext,
  FocusEngineInput,
  FocusEngineValidationError,
  FocusPriority,
  FocusRationaleCode,
  FocusType,
} from './focus-engine.types';

const DRIVER_ORDER: HealthScoreDriverMetric[] = [
  'bmi',
  'whtr',
  'body_fat',
  'activity',
  'age_adjusted_body_fat',
  'age_adjusted_whtr',
];

export const DRIVER_FINAL_WEIGHTS: Record<HealthScoreDriverMetric, number> = {
  bmi: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.bmi,
  whtr: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.whtr,
  body_fat: FINAL_SCORE_WEIGHTS.bodyComposition * BODY_COMPOSITION_WEIGHTS.bodyFat,
  activity: FINAL_SCORE_WEIGHTS.activity,
  age_adjusted_body_fat:
    FINAL_SCORE_WEIGHTS.ageAdjustedHealth * AGE_ADJUSTED_WEIGHTS.bodyFat,
  age_adjusted_whtr: FINAL_SCORE_WEIGHTS.ageAdjustedHealth * AGE_ADJUSTED_WEIGHTS.whtr,
};

const DRIVER_TO_FOCUS: Record<HealthScoreDriverMetric, FocusType> = {
  whtr: 'reduce_waist',
  age_adjusted_whtr: 'reduce_waist',
  activity: 'improve_activity',
  body_fat: 'improve_body_composition',
  age_adjusted_body_fat: 'improve_body_composition',
  bmi: 'improve_weight_balance',
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function roundToInteger(value: number): number {
  return Math.round(value);
}

export function roundConfidence(value: number): number {
  return Math.round(value * 100) / 100;
}

export function mapDriverToFocus(metric: HealthScoreDriverMetric): FocusType {
  return DRIVER_TO_FOCUS[metric];
}

export function buildDriverScoresFromHealthScoreInput(
  input: HealthScoreInput,
): HealthScoreDriverScores {
  const ageYears = calculateAgeYears(input.dateOfBirth, input.asOfDate);
  const bmi = calculateBmi(input.weightKg, input.heightCm);
  const whtr = calculateWhtr(input.waistCm, input.heightCm);
  const { bodyFatPct } = resolveBodyFatPct(input, bmi, ageYears);

  return {
    bmi: scoreBmi(bmi),
    whtr: scoreWhtr(whtr),
    body_fat: scoreBodyFat(bodyFatPct, input.gender),
    activity: ACTIVITY_SCORES[input.activityLevel],
    age_adjusted_body_fat: scoreAgeAdjustedBodyFat(bodyFatPct, ageYears, input.gender),
    age_adjusted_whtr: scoreAgeAdjustedWhtr(whtr, ageYears),
  };
}

export function validateFocusEngineInput(
  input: FocusEngineInput,
): FocusEngineValidationError | null {
  const { healthScore, driverScores } = input;

  if (!healthScore || !driverScores) {
    return { code: 'VALIDATION', message: 'Focus engine input is incomplete.' };
  }

  if (healthScore.scoreVersion !== '1.0.0') {
    return {
      code: 'VALIDATION',
      message: 'Unsupported health score version for focus engine v1.',
    };
  }

  if (!Number.isFinite(healthScore.score)) {
    return { code: 'VALIDATION', message: 'Health score result is missing a valid score.' };
  }

  for (const metric of DRIVER_ORDER) {
    const value = driverScores[metric];

    if (!Number.isFinite(value)) {
      return {
        code: 'VALIDATION',
        message: `Driver score for ${metric} is missing or invalid.`,
      };
    }
  }

  if (
    !healthScore.explanation?.biggestOpportunity ||
    !healthScore.explanation?.primaryDriver ||
    !healthScore.bands ||
    !healthScore.metrics
  ) {
    return {
      code: 'VALIDATION',
      message: 'Health score explanation, bands, or metrics are incomplete.',
    };
  }

  return null;
}

export function isAthleticHighBmiProfile(healthScore: HealthScoreResult): boolean {
  const { bands, metrics } = healthScore;

  return (
    (bands.bmiCategory === 'overweight' || bands.bmiCategory === 'obesity') &&
    (bands.bodyFatCategory === 'athlete' || bands.bodyFatCategory === 'fitness') &&
    metrics.whtr < FOCUS_HEALTHY_WHTR_FOR_ATHLETIC_BMI
  );
}

export function isObeseAthleticHealthyWhtrProfile(healthScore: HealthScoreResult): boolean {
  const { bands, metrics } = healthScore;

  return (
    bands.bmiCategory === 'obesity' &&
    (bands.bodyFatCategory === 'athlete' || bands.bodyFatCategory === 'fitness') &&
    metrics.whtr < FOCUS_HEALTHY_WHTR_FOR_ATHLETIC_BMI
  );
}

export function shouldBlockFocus(
  focus: FocusType,
  healthScore: HealthScoreResult,
): boolean {
  if (focus === 'reduce_waist' && healthScore.bands.bmiCategory === 'underweight') {
    return true;
  }

  if (
    focus === 'improve_weight_balance' &&
    (isAthleticHighBmiProfile(healthScore) || isObeseAthleticHealthyWhtrProfile(healthScore))
  ) {
    return true;
  }

  return false;
}

export function buildDriverContexts(input: FocusEngineInput): FocusDriverContext[] {
  const { healthScore, driverScores } = input;

  return DRIVER_ORDER.map((metric) => {
    const score = driverScores[metric];
    const focus = mapDriverToFocus(metric);
    const blocked = shouldBlockFocus(focus, healthScore);
    const opportunity = blocked
      ? 0
      : DRIVER_FINAL_WEIGHTS[metric] *
        Math.max(0, FOCUS_IMPROVEMENT_REFERENCE_SCORE - score);

    return {
      metric,
      score,
      focus,
      blocked,
      opportunity,
    };
  });
}

export function aggregateFocusCandidates(contexts: FocusDriverContext[]): FocusCandidate[] {
  const grouped = new Map<FocusType, FocusCandidate>();

  for (const context of contexts) {
    if (context.blocked || context.opportunity <= 0) {
      continue;
    }

    const existing = grouped.get(context.focus);

    if (!existing) {
      grouped.set(context.focus, {
        focus: context.focus,
        opportunity: context.opportunity,
        drivers: [context.metric],
        leadDriver: context.metric,
        leadDriverScore: context.score,
      });
      continue;
    }

    existing.opportunity += context.opportunity;
    existing.drivers.push(context.metric);

    const currentLeadOpportunity =
      DRIVER_FINAL_WEIGHTS[existing.leadDriver] *
      Math.max(0, FOCUS_IMPROVEMENT_REFERENCE_SCORE - existing.leadDriverScore);
    const candidateLeadOpportunity =
      DRIVER_FINAL_WEIGHTS[context.metric] *
      Math.max(0, FOCUS_IMPROVEMENT_REFERENCE_SCORE - context.score);

    if (candidateLeadOpportunity > currentLeadOpportunity) {
      existing.leadDriver = context.metric;
      existing.leadDriverScore = context.score;
    }
  }

  return Array.from(grouped.values()).sort((left, right) => right.opportunity - left.opportunity);
}

export function countStrongDrivers(driverScores: HealthScoreDriverScores): number {
  return DRIVER_ORDER.filter((metric) => driverScores[metric] >= FOCUS_STRONG_DRIVER_THRESHOLD)
    .length;
}

export function shouldMaintainCurrentPath(input: FocusEngineInput): boolean {
  const { healthScore, driverScores } = input;
  const strongDrivers = countStrongDrivers(driverScores);

  if (
    healthScore.score >= 85 &&
    strongDrivers >= 4 &&
    DRIVER_ORDER.every((metric) => driverScores[metric] >= 78)
  ) {
    return true;
  }

  const candidates = aggregateFocusCandidates(buildDriverContexts(input));
  const topOpportunity = candidates[0]?.opportunity ?? 0;

  return topOpportunity < FOCUS_MIN_ACTION_OPPORTUNITY;
}

export function simulateTargetDriverScore(
  focus: FocusType,
  metric: HealthScoreDriverMetric,
  currentScore: number,
): number {
  if (focus === 'maintain_current_path') {
    return currentScore;
  }

  if (focus === 'improve_activity' && metric === 'activity') {
    const nextStep = FOCUS_GAIN_SIMULATION.activityStepScores.find(
      (step) => step > currentScore,
    );

    return nextStep ?? currentScore;
  }

  const uplift =
    metric === 'whtr' || metric === 'age_adjusted_whtr'
      ? FOCUS_GAIN_SIMULATION.whtrDriverUplift
      : metric === 'body_fat' || metric === 'age_adjusted_body_fat'
        ? FOCUS_GAIN_SIMULATION.bodyFatDriverUplift
        : metric === 'bmi'
          ? FOCUS_GAIN_SIMULATION.bmiDriverUplift
          : FOCUS_GAIN_SIMULATION.ageAdjustedDriverUplift;

  return clamp(currentScore + uplift, 0, FOCUS_IMPROVEMENT_REFERENCE_SCORE + 5);
}

export function simulateExpectedScoreGain(
  input: FocusEngineInput,
  focus: FocusType,
  leadDriver: HealthScoreDriverMetric,
): number {
  if (focus === 'maintain_current_path') {
    return 0;
  }

  const currentScore = input.driverScores[leadDriver];
  const targetScore = simulateTargetDriverScore(focus, leadDriver, currentScore);
  const delta = targetScore - currentScore;

  if (delta <= 0) {
    return 0;
  }

  const weightedGain = DRIVER_FINAL_WEIGHTS[leadDriver] * delta;
  const supportingGain = buildDriverContexts(input)
    .filter((context) => mapDriverToFocus(context.metric) === focus && context.metric !== leadDriver)
    .reduce((sum, context) => {
      const target = simulateTargetDriverScore(focus, context.metric, context.score);
      const driverDelta = Math.max(0, target - context.score);
      return sum + DRIVER_FINAL_WEIGHTS[context.metric] * driverDelta * 0.35;
    }, 0);

  const rawGain = weightedGain + supportingGain;

  if (rawGain <= 0) {
    return 0;
  }

  return roundToInteger(
    clamp(rawGain, FOCUS_MIN_EXPECTED_GAIN, FOCUS_MAX_EXPECTED_GAIN),
  );
}

export function derivePriority(
  focus: FocusType,
  expectedGain: number,
  healthScore: HealthScoreResult,
): FocusPriority {
  if (focus === 'maintain_current_path') {
    return 'low';
  }

  if (expectedGain >= 4 || (healthScore.score <= 60 && expectedGain >= 3)) {
    return 'high';
  }

  if (expectedGain >= 2) {
    return 'medium';
  }

  return 'low';
}

export function deriveConfidence(
  input: FocusEngineInput,
  primary: FocusCandidate | null,
  secondary: FocusCandidate | null,
  rationaleCode: FocusRationaleCode,
): number {
  let confidence = 0.55;

  if (primary && secondary) {
    const gap = primary.opportunity - secondary.opportunity;
    const gapRatio = gap / Math.max(primary.opportunity, 0.01);
    confidence += clamp(gapRatio * 0.25, 0, 0.25);
  } else if (primary) {
    confidence += 0.2;
  }

  const supportingCount = Math.max(0, (primary?.drivers.length ?? 1) - 1);
  confidence += clamp(supportingCount * 0.05, 0, 0.15);
  confidence += 0.05;

  if (rationaleCode === 'maintain_strong_profile') {
    confidence += 0.1;
  }

  if (rationaleCode === 'close_tie_breaker' || rationaleCode === 'central_adiposity_tie_breaker') {
    confidence -= 0.08;
  }

  return roundConfidence(clamp(confidence, 0, 1));
}

export function compareFocusTypes(left: FocusType, right: FocusType): number {
  return FOCUS_TYPE_TIEBREAK_ORDER.indexOf(left) - FOCUS_TYPE_TIEBREAK_ORDER.indexOf(right);
}

export function isCentralAdiposityCloseTie(
  input: FocusEngineInput,
  candidates: FocusCandidate[],
): boolean {
  if (shouldBlockFocus('reduce_waist', input.healthScore)) {
    return false;
  }

  if (input.healthScore.bands.bmiCategory === 'underweight') {
    return false;
  }

  const whtrRisk = input.healthScore.bands.whtrRisk;

  if (whtrRisk !== 'elevated' && whtrRisk !== 'high') {
    return false;
  }

  const waist = candidates.find((candidate) => candidate.focus === 'reduce_waist');
  const bodyComposition = candidates.find(
    (candidate) => candidate.focus === 'improve_body_composition',
  );

  if (!waist || !bodyComposition) {
    return false;
  }

  const maxOpportunity = Math.max(waist.opportunity, bodyComposition.opportunity);
  const gap = Math.abs(waist.opportunity - bodyComposition.opportunity);

  return gap / Math.max(maxOpportunity, 0.01) <= FOCUS_TIE_RELATIVE_THRESHOLD;
}

export function orderCandidatesWithCentralAdiposityPreference(
  candidates: FocusCandidate[],
): FocusCandidate[] {
  return [...candidates].sort((left, right) => {
    if (left.focus === 'reduce_waist' && right.focus === 'improve_body_composition') {
      return -1;
    }

    if (left.focus === 'improve_body_composition' && right.focus === 'reduce_waist') {
      return 1;
    }

    if (right.opportunity !== left.opportunity) {
      return right.opportunity - left.opportunity;
    }

    return compareFocusTypes(left.focus, right.focus);
  });
}

export function isValidSecondaryFocus(
  input: FocusEngineInput,
  primaryFocus: FocusType,
  focus: FocusType,
): boolean {
  return (
    focus !== primaryFocus &&
    focus !== 'maintain_current_path' &&
    !shouldBlockFocus(focus, input.healthScore)
  );
}

export function resolveValidSecondaryFocus(
  input: FocusEngineInput,
  primaryFocus: FocusType,
  rankedCandidates: FocusCandidate[],
): FocusType | null {
  for (const candidate of rankedCandidates) {
    if (isValidSecondaryFocus(input, primaryFocus, candidate.focus)) {
      return candidate.focus;
    }
  }

  if (primaryFocus === 'maintain_current_path') {
    const engineFocus = mapDriverToFocus(input.healthScore.explanation.biggestOpportunity);

    if (isValidSecondaryFocus(input, primaryFocus, engineFocus)) {
      return engineFocus;
    }
  }

  return null;
}

export function pickRationaleCode(
  input: FocusEngineInput,
  candidates: FocusCandidate[],
): FocusRationaleCode {
  if (candidates.length === 0) {
    return 'maintain_strong_profile';
  }

  if (candidates.length === 1) {
    return 'largest_weighted_opportunity';
  }

  const [first, second] = candidates;
  const relativeGap = (first.opportunity - second.opportunity) / Math.max(first.opportunity, 0.01);

  if (relativeGap <= FOCUS_TIE_RELATIVE_THRESHOLD) {
    return 'close_tie_breaker';
  }

  if (mapDriverToFocus(input.healthScore.explanation.biggestOpportunity) === first.focus) {
    return 'engine_primary_opportunity';
  }

  return 'largest_weighted_opportunity';
}

export function resolvePrimaryAndSecondaryCandidates(
  input: FocusEngineInput,
): {
  primary: FocusCandidate;
  secondary: FocusCandidate | null;
  rankedCandidates: FocusCandidate[];
  rationaleCode: FocusRationaleCode;
} {
  const actionCandidates = aggregateFocusCandidates(buildDriverContexts(input));

  if (shouldMaintainCurrentPath(input)) {
    const leadDriver = input.healthScore.explanation.biggestStrength;

    return {
      primary: {
        focus: 'maintain_current_path',
        opportunity: 0,
        drivers: [],
        leadDriver,
        leadDriverScore: input.driverScores[leadDriver],
      },
      secondary: null,
      rankedCandidates: actionCandidates,
      rationaleCode: 'maintain_strong_profile',
    };
  }

  if (actionCandidates.length === 0) {
    const leadDriver = input.healthScore.explanation.biggestStrength;

    return {
      primary: {
        focus: 'maintain_current_path',
        opportunity: 0,
        drivers: [],
        leadDriver,
        leadDriverScore: input.driverScores[leadDriver],
      },
      secondary: null,
      rankedCandidates: [],
      rationaleCode: 'insufficient_opportunity',
    };
  }

  let rationaleCode = pickRationaleCode(input, actionCandidates);
  let ordered = [...actionCandidates];

  if (isCentralAdiposityCloseTie(input, actionCandidates)) {
    rationaleCode = 'central_adiposity_tie_breaker';
    ordered = orderCandidatesWithCentralAdiposityPreference(actionCandidates);
  } else if (rationaleCode === 'close_tie_breaker') {
    const engineFocus = mapDriverToFocus(input.healthScore.explanation.biggestOpportunity);

    ordered.sort((left, right) => {
      if (left.focus === engineFocus && right.focus !== engineFocus) {
        return -1;
      }

      if (right.focus === engineFocus && left.focus !== engineFocus) {
        return 1;
      }

      if (right.opportunity !== left.opportunity) {
        return right.opportunity - left.opportunity;
      }

      return compareFocusTypes(left.focus, right.focus);
    });
  }

  return {
    primary: ordered[0],
    secondary: ordered[1] ?? null,
    rankedCandidates: ordered,
    rationaleCode,
  };
}
