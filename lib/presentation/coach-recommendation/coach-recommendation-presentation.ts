import {
  getCoachRecommendationPresentationMeta,
} from './coach-recommendation-presentation.catalog';
import type {
  CoachRecommendationPresentationSignals,
  CoachRecommendationPresentationTier,
} from './coach-recommendation-presentation.types';

function signalValue(
  id: 'activity_volume_measured',
  signals: CoachRecommendationPresentationSignals | null | undefined,
): boolean {
  if (id === 'activity_volume_measured') {
    return signals?.activityVolumeMeasured === true;
  }
  return false;
}

/**
 * Conservative Beta 5.1 rule:
 * SPECIFIC numeric dose copy requires measured activity volume.
 * BMI, waist, weight, Health Score, and self-reported activity_level never unlock it.
 */
export function resolveCoachRecommendationPresentationTier(
  recommendationId: string,
  signals?: CoachRecommendationPresentationSignals | null,
): CoachRecommendationPresentationTier {
  const meta = getCoachRecommendationPresentationMeta(recommendationId);
  if (!meta || !meta.specificCopyUsesDose) {
    return 'general';
  }

  const ready = meta.requiredSignalsForSpecific.every((id) => signalValue(id, signals));
  return ready ? 'specific' : 'general';
}
