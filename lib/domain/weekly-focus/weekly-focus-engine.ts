import { WEEKLY_FOCUS_ENGINE_VERSION } from './weekly-focus.constants';
import { isAlcoholSelectable, resolveRecoveryConstraint, scoreWeeklyFocusAreas } from './weekly-focus.scoring';
import { selectWeeklyFocuses } from './weekly-focus.select';
import { resolveWeeklyFocusSignals } from './weekly-focus.signals';
import type { WeeklyFocusEngineInput, WeeklyFocusEngineResult } from './weekly-focus.types';

export function determineWeeklyFocus(input: WeeklyFocusEngineInput): WeeklyFocusEngineResult {
  const signals = resolveWeeklyFocusSignals(input);
  const { scores, recoveryIndependentNeed } = scoreWeeklyFocusAreas(signals);
  const recoveryConstraint = resolveRecoveryConstraint(signals);
  const alcoholSelectable = isAlcoholSelectable(signals);
  const { focuses, insufficientEvidenceFallback } = selectWeeklyFocuses({
    scores,
    signals,
    alcoholSelectable,
    recoveryIndependentNeed,
    recoveryConstraint,
    previousFocuses: input.previousFocuses ?? null,
  });

  return {
    engineVersion: WEEKLY_FOCUS_ENGINE_VERSION,
    focuses,
    scores,
    recoveryConstraint,
    insufficientEvidenceFallback,
  };
}
