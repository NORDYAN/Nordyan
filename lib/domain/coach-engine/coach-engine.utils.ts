import type { FocusEngineResult, FocusPriority, FocusType } from '@/lib/domain/focus-engine';
import type { HealthScoreActivityLevel, HealthScoreResult } from '@/lib/domain/health-score';

import {
  COACH_ACTIVITY_LEVEL_ORDER,
  COACH_ADVANCED_AGE,
  COACH_CATEGORY_TIEBREAK_RANK,
  COACH_FALLBACK_RECOMMENDATION,
  COACH_FOCUS_CANDIDATES,
  COACH_HEALTHY_WHTR_FOR_ATHLETIC_BMI,
  COACH_INTENSITY,
  COACH_OLDER_ADULT_AGE,
} from './coach-engine.constants';
import type {
  CoachEngineInput,
  CoachEngineValidationError,
  CoachRecommendationCandidate,
  CoachRecommendationTemplate,
  CoachSafetyFlag,
} from './coach-engine.types';

export function validateCoachEngineInput(input: CoachEngineInput): CoachEngineValidationError | null {
  if (!input.focus || typeof input.focus !== 'object') {
    return { code: 'VALIDATION', message: 'focus is required' };
  }

  if (!input.healthScore || typeof input.healthScore !== 'object') {
    return { code: 'VALIDATION', message: 'healthScore is required' };
  }

  if (!Number.isFinite(input.age) || input.age < 18 || input.age > 100) {
    return { code: 'VALIDATION', message: 'age must be between 18 and 100' };
  }

  if (input.gender !== 'male' && input.gender !== 'female' && input.gender !== 'other') {
    return { code: 'VALIDATION', message: 'gender must be male, female, or other' };
  }

  if (!COACH_ACTIVITY_LEVEL_ORDER.includes(input.activityLevel)) {
    return { code: 'VALIDATION', message: 'activityLevel is invalid' };
  }

  if (
    typeof input.focus.primaryFocus !== 'string' ||
    typeof input.focus.expectedScoreGain !== 'number' ||
    typeof input.focus.confidence !== 'number' ||
    typeof input.focus.priority !== 'string' ||
    !input.focus.reasoning ||
    typeof input.focus.reasoning.driver !== 'string'
  ) {
    return { code: 'VALIDATION', message: 'focus result is incomplete or invalid' };
  }

  return null;
}

export function isAthleticHighBmiProfile(healthScore: HealthScoreResult): boolean {
  const { bands, metrics } = healthScore;

  return (
    (bands.bmiCategory === 'overweight' || bands.bmiCategory === 'obesity') &&
    (bands.bodyFatCategory === 'athlete' || bands.bodyFatCategory === 'fitness') &&
    metrics.whtr < COACH_HEALTHY_WHTR_FOR_ATHLETIC_BMI
  );
}

export function isOverweightProfile(healthScore: HealthScoreResult): boolean {
  return (
    healthScore.bands.bmiCategory === 'overweight' ||
    healthScore.bands.bmiCategory === 'obesity'
  );
}

export function isUnderweightProfile(healthScore: HealthScoreResult): boolean {
  return healthScore.bands.bmiCategory === 'underweight';
}

/** Mirrors frozen Focus Engine safety rules without modifying that module. */
export function isFocusBlockedBySafetyRules(
  focus: FocusType,
  healthScore: HealthScoreResult,
): boolean {
  if (focus === 'reduce_waist' && isUnderweightProfile(healthScore)) {
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

export function isObeseAthleticHealthyWhtrProfile(healthScore: HealthScoreResult): boolean {
  const { bands, metrics } = healthScore;

  return (
    bands.bmiCategory === 'obesity' &&
    (bands.bodyFatCategory === 'athlete' || bands.bodyFatCategory === 'fitness') &&
    metrics.whtr < COACH_HEALTHY_WHTR_FOR_ATHLETIC_BMI
  );
}

export function getActivityLevelIndex(level: HealthScoreActivityLevel): number {
  return COACH_ACTIVITY_LEVEL_ORDER.indexOf(level);
}

export function getActivityFitDistance(
  userLevel: HealthScoreActivityLevel,
  targetLevels: readonly HealthScoreActivityLevel[],
): number {
  if (targetLevels.includes(userLevel)) {
    return 0;
  }

  const userIndex = getActivityLevelIndex(userLevel);

  return Math.min(
    ...targetLevels.map((level) => Math.abs(getActivityLevelIndex(level) - userIndex)),
  );
}

export function buildFocusCandidates(input: CoachEngineInput): CoachRecommendationCandidate[] {
  const templates = COACH_FOCUS_CANDIDATES[input.focus.primaryFocus] ?? [];

  return templates.map((template) => ({
    ...template,
    focus: input.focus.primaryFocus,
  }));
}

export function isCandidateBlocked(
  candidate: CoachRecommendationCandidate,
  input: CoachEngineInput,
): { blocked: boolean; safetyFlags: CoachSafetyFlag[] } {
  const { healthScore, focus, activityLevel, age } = input;
  const safetyFlags: CoachSafetyFlag[] = [];

  if (
    focus.primaryFocus === 'reduce_waist' &&
    isUnderweightProfile(healthScore) &&
    candidate.category !== 'measurement_follow_up'
  ) {
    safetyFlags.push('underweight_no_weight_loss', 'focus_safety_rule_applied');
    return { blocked: true, safetyFlags };
  }

  if (
    focus.primaryFocus === 'improve_weight_balance' &&
    isFocusBlockedBySafetyRules(focus.primaryFocus, healthScore) &&
    candidate.recommendationId !== 'weight_balance_measurement_check_v1'
  ) {
    safetyFlags.push('athletic_high_bmi_no_generic_weight_loss', 'focus_safety_rule_applied');
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.category === 'strength_training' &&
    (activityLevel === 'sedentary' || activityLevel === 'light')
  ) {
    safetyFlags.push('sedentary_no_advanced_training');
    return { blocked: true, safetyFlags };
  }

  if (
    focus.primaryFocus === 'improve_weight_balance' &&
    isUnderweightProfile(healthScore) &&
    (candidate.recommendationId === 'weight_balance_walking_v1' ||
      candidate.recommendationId === 'weight_balance_active_movement_v1')
  ) {
    safetyFlags.push('underweight_no_weight_loss');
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'weight_balance_gentle_nutrition_v1' &&
    !isUnderweightProfile(healthScore)
  ) {
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'weight_balance_walking_v1' &&
    !isOverweightProfile(healthScore)
  ) {
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'weight_balance_active_movement_v1' &&
    (!isOverweightProfile(healthScore) || isAthleticHighBmiProfile(healthScore))
  ) {
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'weight_balance_measurement_check_v1' &&
    (isUnderweightProfile(healthScore) ||
      (isOverweightProfile(healthScore) && !isAthleticHighBmiProfile(healthScore)))
  ) {
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'maintain_weekly_check_in_v1' &&
    (activityLevel === 'active' || activityLevel === 'very_active') &&
    age < COACH_OLDER_ADULT_AGE
  ) {
    return { blocked: true, safetyFlags };
  }

  if (
    candidate.recommendationId === 'maintain_routine_consistency_v1' &&
    (activityLevel === 'sedentary' ||
      activityLevel === 'light' ||
      activityLevel === 'moderate' ||
      age >= COACH_OLDER_ADULT_AGE)
  ) {
    return { blocked: true, safetyFlags };
  }

  if (age >= COACH_OLDER_ADULT_AGE && candidate.category === 'strength_training') {
    return { blocked: true, safetyFlags };
  }

  return { blocked: false, safetyFlags };
}

export function filterEligibleCandidates(
  candidates: CoachRecommendationCandidate[],
  input: CoachEngineInput,
): CoachRecommendationCandidate[] {
  const eligible: CoachRecommendationCandidate[] = [];

  for (const candidate of candidates) {
    const result = isCandidateBlocked(candidate, input);

    if (!result.blocked) {
      eligible.push(candidate);
    }
  }

  return eligible;
}

export function compareCandidates(
  left: CoachRecommendationCandidate,
  right: CoachRecommendationCandidate,
  userActivityLevel: HealthScoreActivityLevel,
): number {
  const leftDemanding = left.category === 'strength_training';
  const rightDemanding = right.category === 'strength_training';

  if (leftDemanding !== rightDemanding) {
    return leftDemanding ? 1 : -1;
  }

  const leftFit = getActivityFitDistance(userActivityLevel, left.targetActivityLevels);
  const rightFit = getActivityFitDistance(userActivityLevel, right.targetActivityLevels);

  if (leftFit !== rightFit) {
    return leftFit - rightFit;
  }

  const categoryDiff =
    COACH_CATEGORY_TIEBREAK_RANK[left.category] - COACH_CATEGORY_TIEBREAK_RANK[right.category];

  if (categoryDiff !== 0) {
    return categoryDiff;
  }

  if (left.riskLevel !== right.riskLevel) {
    return left.riskLevel - right.riskLevel;
  }

  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  return left.recommendationId.localeCompare(right.recommendationId);
}

export function selectBestCandidate(
  candidates: CoachRecommendationCandidate[],
  input: CoachEngineInput,
): CoachRecommendationCandidate {
  const sorted = [...candidates].sort((left, right) =>
    compareCandidates(left, right, input.activityLevel),
  );

  return sorted[0] ?? {
    ...COACH_FALLBACK_RECOMMENDATION,
    focus: input.focus.primaryFocus,
  };
}

export function scaleIntensity(
  template: CoachRecommendationTemplate,
  input: CoachEngineInput,
): {
  durationMinutes: number;
  frequencyPerWeek: number;
  safetyFlags: CoachSafetyFlag[];
} {
  const { focus, age, activityLevel } = input;
  const safetyFlags: CoachSafetyFlag[] = [];

  let duration = template.baseDurationMinutes;
  let frequency = template.baseFrequencyPerWeek;

  if (focus.priority === 'high' && template.category !== 'measurement_follow_up') {
    frequency += COACH_INTENSITY.highPriorityFrequencyBonus;
  }

  if (focus.confidence < COACH_INTENSITY.lowConfidenceThreshold) {
    frequency -= COACH_INTENSITY.lowConfidenceFrequencyReduction;
    duration = Math.max(
      COACH_INTENSITY.minDurationMinutes,
      duration - 5,
    );
    safetyFlags.push('low_confidence_conservative_scaling');
  } else if (focus.confidence >= COACH_INTENSITY.highConfidenceThreshold) {
    // Keep base values — confidence supports standard prescription.
  }

  const beforeAgeDuration = duration;
  const beforeAgeFrequency = frequency;

  if (age >= COACH_ADVANCED_AGE) {
    duration = Math.round(duration * COACH_INTENSITY.advancedAgeDurationFactor);
    frequency -= COACH_INTENSITY.olderAdultFrequencyReduction;
  } else if (age >= COACH_OLDER_ADULT_AGE) {
    duration = Math.round(duration * COACH_INTENSITY.olderAdultDurationFactor);
    if (template.category !== 'measurement_follow_up' && template.category !== 'maintain') {
      frequency -= COACH_INTENSITY.olderAdultFrequencyReduction;
    }
  }

  if (activityLevel === 'sedentary' && template.category === 'walking') {
    frequency = Math.min(frequency, 4);
  }

  duration = Math.min(
    COACH_INTENSITY.maxDurationMinutes,
    Math.max(COACH_INTENSITY.minDurationMinutes, duration),
  );
  frequency = Math.min(
    COACH_INTENSITY.maxFrequencyPerWeek,
    Math.max(COACH_INTENSITY.minFrequencyPerWeek, frequency),
  );

  if (template.category === 'measurement_follow_up' || template.category === 'maintain') {
    duration = template.baseDurationMinutes;
    frequency = template.baseFrequencyPerWeek;
  } else if (
    age >= COACH_OLDER_ADULT_AGE &&
    (duration !== beforeAgeDuration || frequency !== beforeAgeFrequency)
  ) {
    safetyFlags.push('older_adult_intensity_capped');
  }

  return {
    durationMinutes: duration,
    frequencyPerWeek: frequency,
    safetyFlags,
  };
}

export function collectSelectionSafetyFlags(
  candidate: CoachRecommendationCandidate,
  input: CoachEngineInput,
  options: { usedFallback: boolean },
): CoachSafetyFlag[] {
  const flags: CoachSafetyFlag[] = [];
  const blockResult = isCandidateBlocked(candidate, input);

  if (options.usedFallback) {
    flags.push('focus_safety_rule_applied');
  }

  if (
    input.focus.primaryFocus === 'improve_weight_balance' &&
    isFocusBlockedBySafetyRules(input.focus.primaryFocus, input.healthScore) &&
    candidate.recommendationId === 'weight_balance_measurement_check_v1'
  ) {
    flags.push('athletic_high_bmi_no_generic_weight_loss', 'focus_safety_rule_applied');
  }

  if (
    input.focus.primaryFocus === 'reduce_waist' &&
    isUnderweightProfile(input.healthScore) &&
    candidate.recommendationId === 'waist_measurement_follow_up_v1'
  ) {
    flags.push('underweight_no_weight_loss', 'focus_safety_rule_applied');
  }

  return [...new Set([...flags, ...blockResult.safetyFlags])];
}

export function resolveRationaleCode(
  candidate: CoachRecommendationCandidate,
  usedFallback: boolean,
  hadSafetyConstraint: boolean,
): CoachRecommendationCandidate['rationaleCode'] {
  if (usedFallback) {
    return 'fallback_safe_action';
  }

  if (hadSafetyConstraint) {
    return 'safety_constrained_selection';
  }

  return candidate.rationaleCode;
}

export function buildCoachResult(
  candidate: CoachRecommendationCandidate,
  input: CoachEngineInput,
  options: {
    usedFallback: boolean;
  },
): {
  recommendationId: string;
  category: CoachRecommendationCandidate['category'];
  titleKey: string;
  descriptionKey: string;
  durationMinutes: number;
  frequencyPerWeek: number;
  priority: FocusPriority;
  expectedScoreGain: number;
  confidence: number;
  rationale: {
    focus: FocusEngineResult['primaryFocus'];
    driver: string;
    rationaleCode: CoachRecommendationCandidate['rationaleCode'];
  };
  safetyFlags: CoachSafetyFlag[];
} {
  const scaled = scaleIntensity(candidate, input);
  const selectionFlags = collectSelectionSafetyFlags(candidate, input, options);
  const safetyFlags = [...new Set([...selectionFlags, ...scaled.safetyFlags])];
  const hadSafetyConstraint = options.usedFallback || selectionFlags.length > 0;

  return {
    recommendationId: candidate.recommendationId,
    category: candidate.category,
    titleKey: candidate.titleKey,
    descriptionKey: candidate.descriptionKey,
    durationMinutes: scaled.durationMinutes,
    frequencyPerWeek: scaled.frequencyPerWeek,
    priority: input.focus.priority,
    expectedScoreGain: input.focus.expectedScoreGain,
    confidence: input.focus.confidence,
    rationale: {
      focus: input.focus.primaryFocus,
      driver: input.focus.reasoning.driver,
      rationaleCode: resolveRationaleCode(candidate, options.usedFallback, hadSafetyConstraint),
    },
    safetyFlags,
  };
}
