import type { FocusEngineResult, FocusPriority, FocusType } from '@/lib/domain/focus-engine';
import type {
  HealthScoreActivityLevel,
  HealthScoreGender,
  HealthScoreResult,
} from '@/lib/domain/health-score';
import type { ProfileGoal } from '@/lib/domain/profile';

import type { COACH_ENGINE_VERSION } from './coach-engine.constants';

export type CoachRecommendationCategory =
  | 'walking'
  | 'general_activity'
  | 'strength_training'
  | 'measurement_follow_up'
  | 'nutrition_habit'
  | 'recovery'
  | 'maintain';

export type CoachPriority = FocusPriority;

export type CoachRationaleCode =
  | 'lowest_risk_highest_impact_action'
  | 'activity_level_matched_progression'
  | 'balanced_body_composition_action'
  | 'weight_balance_context_action'
  | 'maintain_consistency'
  | 'measurement_when_ambiguous'
  | 'safety_constrained_selection'
  | 'fallback_safe_action';

export type CoachSafetyFlag =
  | 'underweight_no_weight_loss'
  | 'athletic_high_bmi_no_generic_weight_loss'
  | 'sedentary_no_advanced_training'
  | 'older_adult_intensity_capped'
  | 'low_confidence_conservative_scaling'
  | 'focus_safety_rule_applied';

export type CoachRationale = {
  focus: FocusType;
  driver: string;
  rationaleCode: CoachRationaleCode;
};

export type CoachEngineResult = {
  coachVersion: typeof COACH_ENGINE_VERSION;
  recommendationId: string;
  category: CoachRecommendationCategory;
  titleKey: string;
  descriptionKey: string;
  durationMinutes: number;
  frequencyPerWeek: number;
  priority: CoachPriority;
  expectedScoreGain: number;
  confidence: number;
  rationale: CoachRationale;
  safetyFlags: CoachSafetyFlag[];
};

export type CoachEngineInput = {
  focus: FocusEngineResult;
  healthScore: HealthScoreResult;
  age: number;
  gender: HealthScoreGender;
  activityLevel: HealthScoreActivityLevel;
  userGoal?: ProfileGoal;
};

export type CoachEngineValidationError = {
  code: 'VALIDATION';
  message: string;
};

export type CoachEngineOutput =
  | { ok: true; value: CoachEngineResult }
  | { ok: false; error: CoachEngineValidationError };

export type CoachRecommendationTemplate = {
  recommendationId: string;
  category: CoachRecommendationCategory;
  titleKey: string;
  descriptionKey: string;
  baseDurationMinutes: number;
  baseFrequencyPerWeek: number;
  riskLevel: number;
  targetActivityLevels: readonly HealthScoreActivityLevel[];
  sortOrder: number;
  rationaleCode: CoachRationaleCode;
};

export type CoachRecommendationCandidate = CoachRecommendationTemplate & {
  focus: FocusType;
};
