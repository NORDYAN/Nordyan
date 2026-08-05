import { generateRecommendation } from '@/lib/domain/coach-engine';
import type { UserProfile } from '@/lib/domain/profile';
import type { HomeHealthScoreState } from '@/lib/services/health-score';
import type { HomePrimaryFocusState } from '@/lib/services/focus';

import { formatCoachMessage, getCoachPresentation } from './coach.presentation';
import type { HomeCoachState } from './coach.service.types';

export function buildHomeCoachState(
  profile: UserProfile | null,
  healthScoreState: HomeHealthScoreState,
  primaryFocusState: HomePrimaryFocusState,
): HomeCoachState {
  if (healthScoreState.status === 'loading' || primaryFocusState.status === 'loading') {
    return { status: 'loading' };
  }

  if (healthScoreState.status === 'unavailable' || primaryFocusState.status === 'unavailable') {
    return { status: 'unavailable' };
  }

  const coachResult = generateRecommendation({
    focus: primaryFocusState.result,
    healthScore: healthScoreState.result,
    age: healthScoreState.result.metrics.ageYears,
    gender: healthScoreState.input.gender,
    activityLevel: healthScoreState.input.activityLevel,
    userGoal: profile?.goal ?? undefined,
  });

  if (!coachResult.ok) {
    return { status: 'unavailable' };
  }

  const presentation = getCoachPresentation(
    coachResult.value.recommendationId,
    coachResult.value.durationMinutes,
    coachResult.value.frequencyPerWeek,
  );

  return {
    status: 'ready',
    message: formatCoachMessage(presentation.description),
    title: presentation.title,
    description: presentation.description,
    recommendationId: coachResult.value.recommendationId,
    category: coachResult.value.category,
    durationMinutes: coachResult.value.durationMinutes,
    frequencyPerWeek: coachResult.value.frequencyPerWeek,
    expectedScoreGain: coachResult.value.expectedScoreGain,
    confidence: coachResult.value.confidence,
    safetyFlags: coachResult.value.safetyFlags,
    result: coachResult.value,
  };
}
