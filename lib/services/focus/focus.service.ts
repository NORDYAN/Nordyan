import { determineFocus } from '@/lib/domain/focus-engine';
import { buildDriverScoresFromHealthScoreInput } from '@/lib/domain/focus-engine/focus-engine.utils';
import type { HomeHealthScoreState } from '@/lib/services/health-score';

import { getFocusPresentation } from './focus.presentation';
import type { HomePrimaryFocusState } from './focus.service.types';

export function buildHomePrimaryFocusState(
  healthScoreState: HomeHealthScoreState,
): HomePrimaryFocusState {
  if (healthScoreState.status === 'loading') {
    return { status: 'loading' };
  }

  if (healthScoreState.status === 'unavailable') {
    return { status: 'unavailable' };
  }

  const driverScores = buildDriverScoresFromHealthScoreInput(healthScoreState.input);
  const focusResult = determineFocus({
    healthScore: healthScoreState.result,
    driverScores,
  });

  if (!focusResult.ok) {
    return { status: 'unavailable' };
  }

  const presentation = getFocusPresentation(focusResult.value.primaryFocus);

  return {
    status: 'ready',
    title: presentation.title,
    subtitle: presentation.subtitle,
    primaryFocus: focusResult.value.primaryFocus,
    expectedScoreGain: focusResult.value.expectedScoreGain,
    priority: focusResult.value.priority,
    confidence: focusResult.value.confidence,
    driver: focusResult.value.reasoning.driver,
    result: focusResult.value,
  };
}
