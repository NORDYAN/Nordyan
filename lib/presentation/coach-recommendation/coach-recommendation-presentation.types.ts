import type { CoachRecommendationCategory } from '@/lib/domain/coach-engine';

export const COACH_RECOMMENDATION_PRESENTATION_TIERS = ['general', 'specific'] as const;
export type CoachRecommendationPresentationTier =
  (typeof COACH_RECOMMENDATION_PRESENTATION_TIERS)[number];

/**
 * Signals that can unlock numeric/SPECIFIC copy.
 * BMI, Health Score, activity_level, and HS activity-component points do not qualify.
 */
export const COACH_RECOMMENDATION_SPECIFIC_SIGNAL_IDS = [
  'activity_volume_measured',
] as const;

export type CoachRecommendationSpecificSignalId =
  (typeof COACH_RECOMMENDATION_SPECIFIC_SIGNAL_IDS)[number];

export type CoachRecommendationPresentationSignals = {
  /** Measured steps / device / wearable activity volume. Not self-reported activity level. */
  activityVolumeMeasured?: boolean;
};

export type CoachRecommendationPresentationMeta = {
  recommendationId: string;
  category: CoachRecommendationCategory;
  /** When false, always use GENERAL copy even if future signals arrive. */
  specificCopyUsesDose: boolean;
  requiredSignalsForSpecific: readonly CoachRecommendationSpecificSignalId[];
  /** Documented only. Not used for Beta 5.1 selection or presentation. */
  futureTrendSignals: readonly string[];
  /** Documented only. Does not change Coach Engine winner selection. */
  cooldownDays: number;
};
