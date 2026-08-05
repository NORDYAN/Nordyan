import { FOCUS_ENGINE_VERSION } from './focus-engine.constants';
import type { FocusEngineInput, FocusEngineOutput, FocusEngineResult } from './focus-engine.types';
import {
  deriveConfidence,
  derivePriority,
  resolvePrimaryAndSecondaryCandidates,
  resolveValidSecondaryFocus,
  simulateExpectedScoreGain,
  simulateTargetDriverScore,
  validateFocusEngineInput,
} from './focus-engine.utils';

export function determineFocus(input: FocusEngineInput): FocusEngineOutput {
  const validationError = validateFocusEngineInput(input);

  if (validationError) {
    return { ok: false, error: validationError };
  }

  const { primary, rankedCandidates, rationaleCode } = resolvePrimaryAndSecondaryCandidates(input);
  const primaryFocus = primary.focus;
  const secondaryFocus = resolveValidSecondaryFocus(input, primaryFocus, rankedCandidates);
  const leadDriver = primary.leadDriver;
  const currentDriverScore = input.driverScores[leadDriver];
  const targetDriverScore = simulateTargetDriverScore(
    primaryFocus,
    leadDriver,
    currentDriverScore,
  );
  const expectedScoreGain = simulateExpectedScoreGain(input, primaryFocus, leadDriver);
  const secondaryCandidate =
    secondaryFocus === null
      ? null
      : rankedCandidates.find((candidate) => candidate.focus === secondaryFocus) ?? null;
  const confidence = deriveConfidence(input, primary, secondaryCandidate, rationaleCode);
  const priority = derivePriority(primaryFocus, expectedScoreGain, input.healthScore);

  const supportingDrivers = primary.drivers.filter((driver) => driver !== leadDriver);

  const result: FocusEngineResult = {
    focusVersion: FOCUS_ENGINE_VERSION,
    primaryFocus,
    secondaryFocus,
    expectedScoreGain,
    confidence,
    priority,
    reasoning: {
      driver: leadDriver,
      currentDriverScore,
      targetDriverScore,
      supportingDrivers,
      rationaleCode,
    },
  };

  return { ok: true, value: result };
}
