import type { FocusType } from '@/lib/domain/focus-engine';
import type { HealthScoreActivityLevel } from '@/lib/domain/health-score';

import type {
  CoachRecommendationCategory,
  CoachRecommendationTemplate,
} from './coach-engine.types';

export const COACH_ENGINE_VERSION = '1.0.0';

/** Calibration-complete release status. */
export const COACH_ENGINE_STATUS = 'frozen' as const;

export const COACH_OLDER_ADULT_AGE = 65;
export const COACH_ADVANCED_AGE = 75;

/** WHtR threshold aligned with Focus Engine athletic high-BMI safety rule. */
export const COACH_HEALTHY_WHTR_FOR_ATHLETIC_BMI = 0.48;

export const COACH_ACTIVITY_LEVEL_ORDER: readonly HealthScoreActivityLevel[] = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;

/** Lower rank = preferred in tie-breaking. */
export const COACH_CATEGORY_TIEBREAK_RANK: Record<CoachRecommendationCategory, number> = {
  walking: 0,
  general_activity: 1,
  measurement_follow_up: 2,
  nutrition_habit: 3,
  recovery: 4,
  maintain: 5,
  strength_training: 6,
};

export const COACH_INTENSITY = {
  lowConfidenceThreshold: 0.6,
  highConfidenceThreshold: 0.75,
  olderAdultDurationFactor: 0.85,
  advancedAgeDurationFactor: 0.75,
  olderAdultFrequencyReduction: 1,
  lowConfidenceFrequencyReduction: 1,
  highPriorityFrequencyBonus: 1,
  minDurationMinutes: 10,
  minFrequencyPerWeek: 1,
  maxDurationMinutes: 45,
  maxFrequencyPerWeek: 6,
} as const;

const reduceWaistCandidates: CoachRecommendationTemplate[] = [
  {
    recommendationId: 'waist_walk_after_dinner_v1',
    category: 'walking',
    titleKey: 'coach.waist.walk_after_dinner.title',
    descriptionKey: 'coach.waist.walk_after_dinner.description',
    baseDurationMinutes: 30,
    baseFrequencyPerWeek: 5,
    riskLevel: 1,
    targetActivityLevels: ['sedentary', 'light'],
    sortOrder: 10,
    rationaleCode: 'lowest_risk_highest_impact_action',
  },
  {
    recommendationId: 'waist_increase_walking_volume_v1',
    category: 'walking',
    titleKey: 'coach.waist.increase_walking_volume.title',
    descriptionKey: 'coach.waist.increase_walking_volume.description',
    baseDurationMinutes: 25,
    baseFrequencyPerWeek: 4,
    riskLevel: 1,
    targetActivityLevels: ['moderate'],
    sortOrder: 20,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'waist_active_walk_progression_v1',
    category: 'general_activity',
    titleKey: 'coach.waist.active_walk_progression.title',
    descriptionKey: 'coach.waist.active_walk_progression.description',
    baseDurationMinutes: 35,
    baseFrequencyPerWeek: 4,
    riskLevel: 2,
    targetActivityLevels: ['active', 'very_active'],
    sortOrder: 30,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'waist_measurement_follow_up_v1',
    category: 'measurement_follow_up',
    titleKey: 'coach.waist.measurement_follow_up.title',
    descriptionKey: 'coach.waist.measurement_follow_up.description',
    baseDurationMinutes: 5,
    baseFrequencyPerWeek: 1,
    riskLevel: 0,
    targetActivityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    sortOrder: 40,
    rationaleCode: 'measurement_when_ambiguous',
  },
];

const improveActivityCandidates: CoachRecommendationTemplate[] = [
  {
    recommendationId: 'activity_sedentary_walk_start_v1',
    category: 'walking',
    titleKey: 'coach.activity.sedentary_walk_start.title',
    descriptionKey: 'coach.activity.sedentary_walk_start.description',
    baseDurationMinutes: 15,
    baseFrequencyPerWeek: 3,
    riskLevel: 1,
    targetActivityLevels: ['sedentary'],
    sortOrder: 10,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'activity_light_walk_build_v1',
    category: 'walking',
    titleKey: 'coach.activity.light_walk_build.title',
    descriptionKey: 'coach.activity.light_walk_build.description',
    baseDurationMinutes: 20,
    baseFrequencyPerWeek: 4,
    riskLevel: 1,
    targetActivityLevels: ['light'],
    sortOrder: 20,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'activity_moderate_brisk_walk_v1',
    category: 'walking',
    titleKey: 'coach.activity.moderate_brisk_walk.title',
    descriptionKey: 'coach.activity.moderate_brisk_walk.description',
    baseDurationMinutes: 30,
    baseFrequencyPerWeek: 4,
    riskLevel: 2,
    targetActivityLevels: ['moderate'],
    sortOrder: 30,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'activity_active_structured_movement_v1',
    category: 'general_activity',
    titleKey: 'coach.activity.active_structured_movement.title',
    descriptionKey: 'coach.activity.active_structured_movement.description',
    baseDurationMinutes: 30,
    baseFrequencyPerWeek: 4,
    riskLevel: 2,
    targetActivityLevels: ['active'],
    sortOrder: 40,
    rationaleCode: 'activity_level_matched_progression',
  },
  {
    recommendationId: 'activity_very_active_strength_v1',
    category: 'strength_training',
    titleKey: 'coach.activity.very_active_strength.title',
    descriptionKey: 'coach.activity.very_active_strength.description',
    baseDurationMinutes: 25,
    baseFrequencyPerWeek: 2,
    riskLevel: 3,
    targetActivityLevels: ['very_active'],
    sortOrder: 50,
    rationaleCode: 'activity_level_matched_progression',
  },
];

const improveBodyCompositionCandidates: CoachRecommendationTemplate[] = [
  {
    recommendationId: 'body_comp_daily_walk_v1',
    category: 'walking',
    titleKey: 'coach.body_comp.daily_walk.title',
    descriptionKey: 'coach.body_comp.daily_walk.description',
    baseDurationMinutes: 25,
    baseFrequencyPerWeek: 4,
    riskLevel: 1,
    targetActivityLevels: ['sedentary', 'light'],
    sortOrder: 10,
    rationaleCode: 'balanced_body_composition_action',
  },
  {
    recommendationId: 'body_comp_walk_strength_combo_v1',
    category: 'general_activity',
    titleKey: 'coach.body_comp.walk_strength_combo.title',
    descriptionKey: 'coach.body_comp.walk_strength_combo.description',
    baseDurationMinutes: 30,
    baseFrequencyPerWeek: 3,
    riskLevel: 2,
    targetActivityLevels: ['moderate'],
    sortOrder: 20,
    rationaleCode: 'balanced_body_composition_action',
  },
  {
    recommendationId: 'body_comp_strength_foundation_v1',
    category: 'strength_training',
    titleKey: 'coach.body_comp.strength_foundation.title',
    descriptionKey: 'coach.body_comp.strength_foundation.description',
    baseDurationMinutes: 20,
    baseFrequencyPerWeek: 2,
    riskLevel: 3,
    targetActivityLevels: ['active', 'very_active'],
    sortOrder: 30,
    rationaleCode: 'balanced_body_composition_action',
  },
];

const improveWeightBalanceCandidates: CoachRecommendationTemplate[] = [
  {
    recommendationId: 'weight_balance_gentle_nutrition_v1',
    category: 'nutrition_habit',
    titleKey: 'coach.weight_balance.gentle_nutrition.title',
    descriptionKey: 'coach.weight_balance.gentle_nutrition.description',
    baseDurationMinutes: 10,
    baseFrequencyPerWeek: 5,
    riskLevel: 1,
    targetActivityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    sortOrder: 10,
    rationaleCode: 'weight_balance_context_action',
  },
  {
    recommendationId: 'weight_balance_walking_v1',
    category: 'walking',
    titleKey: 'coach.weight_balance.walking.title',
    descriptionKey: 'coach.weight_balance.walking.description',
    baseDurationMinutes: 25,
    baseFrequencyPerWeek: 4,
    riskLevel: 1,
    targetActivityLevels: ['sedentary', 'light', 'moderate'],
    sortOrder: 20,
    rationaleCode: 'weight_balance_context_action',
  },
  {
    recommendationId: 'weight_balance_active_movement_v1',
    category: 'general_activity',
    titleKey: 'coach.weight_balance.active_movement.title',
    descriptionKey: 'coach.weight_balance.active_movement.description',
    baseDurationMinutes: 30,
    baseFrequencyPerWeek: 3,
    riskLevel: 2,
    targetActivityLevels: ['active', 'very_active'],
    sortOrder: 30,
    rationaleCode: 'weight_balance_context_action',
  },
  {
    recommendationId: 'weight_balance_measurement_check_v1',
    category: 'measurement_follow_up',
    titleKey: 'coach.weight_balance.measurement_check.title',
    descriptionKey: 'coach.weight_balance.measurement_check.description',
    baseDurationMinutes: 5,
    baseFrequencyPerWeek: 1,
    riskLevel: 0,
    targetActivityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    sortOrder: 40,
    rationaleCode: 'measurement_when_ambiguous',
  },
];

const maintainCandidates: CoachRecommendationTemplate[] = [
  {
    recommendationId: 'maintain_weekly_check_in_v1',
    category: 'maintain',
    titleKey: 'coach.maintain.weekly_check_in.title',
    descriptionKey: 'coach.maintain.weekly_check_in.description',
    baseDurationMinutes: 10,
    baseFrequencyPerWeek: 1,
    riskLevel: 0,
    targetActivityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
    sortOrder: 10,
    rationaleCode: 'maintain_consistency',
  },
  {
    recommendationId: 'maintain_routine_consistency_v1',
    category: 'maintain',
    titleKey: 'coach.maintain.routine_consistency.title',
    descriptionKey: 'coach.maintain.routine_consistency.description',
    baseDurationMinutes: 15,
    baseFrequencyPerWeek: 2,
    riskLevel: 0,
    targetActivityLevels: ['active', 'very_active'],
    sortOrder: 20,
    rationaleCode: 'maintain_consistency',
  },
];

export const COACH_FOCUS_CANDIDATES: Record<FocusType, CoachRecommendationTemplate[]> = {
  reduce_waist: reduceWaistCandidates,
  improve_activity: improveActivityCandidates,
  improve_body_composition: improveBodyCompositionCandidates,
  improve_weight_balance: improveWeightBalanceCandidates,
  maintain_current_path: maintainCandidates,
};

/** Safe fallback when all focus-specific candidates are filtered out. */
export const COACH_FALLBACK_RECOMMENDATION: CoachRecommendationTemplate = {
  recommendationId: 'fallback_gentle_walk_v1',
  category: 'walking',
  titleKey: 'coach.fallback.gentle_walk.title',
  descriptionKey: 'coach.fallback.gentle_walk.description',
  baseDurationMinutes: 15,
  baseFrequencyPerWeek: 3,
  riskLevel: 1,
  targetActivityLevels: ['sedentary', 'light', 'moderate', 'active', 'very_active'],
  sortOrder: 999,
  rationaleCode: 'fallback_safe_action',
};
