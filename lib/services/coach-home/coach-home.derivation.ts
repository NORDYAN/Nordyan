import type { FocusType } from '@/lib/domain/focus-engine';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import { getCoachPresentation } from '@/lib/services/coach/coach.presentation';
import { getFocusPresentation } from '@/lib/services/focus';

import type { CoachHomeSummary } from './coach-home.types';

const FOCUS_TYPES: readonly FocusType[] = [
  'reduce_waist',
  'improve_activity',
  'improve_body_composition',
  'improve_weight_balance',
  'maintain_current_path',
];

function isFocusType(value: string): value is FocusType {
  return (FOCUS_TYPES as readonly string[]).includes(value);
}

/**
 * Read-only Coach Home composition from a persisted snapshot.
 * Does not invoke Health Score / Focus / Coach engines.
 */
export function buildCoachHomeSummary(snapshot: HealthSnapshot | null): CoachHomeSummary {
  if (!snapshot) {
    return { status: 'empty' };
  }

  if (!isFocusType(snapshot.primaryFocus)) {
    return { status: 'empty' };
  }

  const focusPresentation = getFocusPresentation(snapshot.primaryFocus);
  const recommendationId = snapshot.coachRecommendationId?.trim() ?? '';
  const duration = snapshot.coachDurationMinutes;
  const frequency = snapshot.coachFrequencyPerWeek;

  const planReady =
    recommendationId.length > 0 &&
    duration != null &&
    frequency != null &&
    duration > 0 &&
    frequency > 0;

  if (!planReady) {
    return {
      status: 'ready',
      focus: {
        type: snapshot.primaryFocus,
        title: focusPresentation.title,
        subtitle: focusPresentation.subtitle,
      },
      plan: {
        available: false,
        recommendationId: recommendationId.length > 0 ? recommendationId : null,
      },
    };
  }

  const coachPresentation = getCoachPresentation(recommendationId, duration, frequency);

  return {
    status: 'ready',
    focus: {
      type: snapshot.primaryFocus,
      title: focusPresentation.title,
      subtitle: focusPresentation.subtitle,
    },
    plan: {
      available: true,
      recommendationId,
      title: coachPresentation.title,
      description: coachPresentation.description,
      durationMinutes: duration,
      frequencyPerWeek: frequency,
    },
  };
}
