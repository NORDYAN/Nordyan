import { COACH_ENGINE_VERSION } from './coach-engine.constants';
import type { CoachEngineInput, CoachEngineOutput, CoachEngineResult } from './coach-engine.types';
import {
  buildCoachResult,
  buildFocusCandidates,
  filterEligibleCandidates,
  selectBestCandidate,
  validateCoachEngineInput,
} from './coach-engine.utils';

export function generateRecommendation(input: CoachEngineInput): CoachEngineOutput {
  const validationError = validateCoachEngineInput(input);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const candidates = buildFocusCandidates(input);
  const eligible = filterEligibleCandidates(candidates, input);
  const usedFallback = eligible.length === 0;
  const selected = selectBestCandidate(eligible, input);
  const built = buildCoachResult(selected, input, {
    usedFallback,
  });

  const result: CoachEngineResult = {
    coachVersion: COACH_ENGINE_VERSION,
    ...built,
  };

  return { ok: true, value: result };
}
