import type { CoachRecommendationCategory } from '@/lib/domain/coach-engine';

import type { CoachRecommendationPresentationMeta } from './coach-recommendation-presentation.types';

const NUMERIC_WALKING: Pick<
  CoachRecommendationPresentationMeta,
  | 'specificCopyUsesDose'
  | 'requiredSignalsForSpecific'
  | 'futureTrendSignals'
  | 'cooldownDays'
> = {
  specificCopyUsesDose: true,
  requiredSignalsForSpecific: ['activity_volume_measured'],
  futureTrendSignals: ['comparable_activity_history'],
  cooldownDays: 7,
};

const ALWAYS_GENERAL: Pick<
  CoachRecommendationPresentationMeta,
  | 'specificCopyUsesDose'
  | 'requiredSignalsForSpecific'
  | 'futureTrendSignals'
  | 'cooldownDays'
> = {
  specificCopyUsesDose: false,
  requiredSignalsForSpecific: [],
  futureTrendSignals: [],
  cooldownDays: 7,
};

function entry(
  recommendationId: string,
  category: CoachRecommendationCategory,
  kind: 'numeric' | 'general',
): CoachRecommendationPresentationMeta {
  return {
    recommendationId,
    category,
    ...(kind === 'numeric' ? NUMERIC_WALKING : ALWAYS_GENERAL),
  };
}

export const COACH_RECOMMENDATION_PRESENTATION_CATALOG: readonly CoachRecommendationPresentationMeta[] =
  [
    entry('waist_walk_after_dinner_v1', 'walking', 'numeric'),
    entry('waist_increase_walking_volume_v1', 'walking', 'general'),
    entry('waist_active_walk_progression_v1', 'general_activity', 'numeric'),
    entry('waist_measurement_follow_up_v1', 'measurement_follow_up', 'general'),
    entry('activity_sedentary_walk_start_v1', 'walking', 'numeric'),
    entry('activity_light_walk_build_v1', 'walking', 'numeric'),
    entry('activity_moderate_brisk_walk_v1', 'walking', 'numeric'),
    entry('activity_active_structured_movement_v1', 'general_activity', 'numeric'),
    entry('activity_very_active_strength_v1', 'strength_training', 'numeric'),
    entry('body_comp_daily_walk_v1', 'walking', 'numeric'),
    entry('body_comp_walk_strength_combo_v1', 'general_activity', 'numeric'),
    entry('body_comp_strength_foundation_v1', 'strength_training', 'numeric'),
    entry('weight_balance_gentle_nutrition_v1', 'nutrition_habit', 'general'),
    entry('weight_balance_walking_v1', 'walking', 'numeric'),
    entry('weight_balance_active_movement_v1', 'general_activity', 'numeric'),
    entry('weight_balance_measurement_check_v1', 'measurement_follow_up', 'general'),
    entry('maintain_weekly_check_in_v1', 'maintain', 'general'),
    entry('maintain_routine_consistency_v1', 'maintain', 'general'),
    entry('fallback_gentle_walk_v1', 'walking', 'numeric'),
  ];

const BY_ID = new Map(
  COACH_RECOMMENDATION_PRESENTATION_CATALOG.map((item) => [item.recommendationId, item]),
);

export function getCoachRecommendationPresentationMeta(
  recommendationId: string,
): CoachRecommendationPresentationMeta | null {
  return BY_ID.get(recommendationId) ?? null;
}
