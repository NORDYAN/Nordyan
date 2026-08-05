import type { CoachDecisionResult, CoachPromptPayload } from './coachSimulator.types';
import { COACH_PROMPT_PAYLOAD_VERSION } from '../shared/coachContracts';

export function buildCoachPromptPayload(decision: CoachDecisionResult): CoachPromptPayload {
  return {
    version: COACH_PROMPT_PAYLOAD_VERSION,
    locale: 'sv-SE',
    generatedAt: new Date().toISOString(),
    decision: {
      topStrength: decision.topStrength,
      topOpportunity: decision.topOpportunity,
      coachGoal: decision.coachGoal,
      recommendedAction: decision.recommendedAction,
      confidence: decision.confidence,
      insufficientData: decision.insufficientData,
      silenceEligible: decision.silenceEligible,
    },
    supportingFacts: decision.supportingFacts,
    instructions: {
      role: 'NORDYAN Coach',
      tone:
        decision.coachGoal === 'Motivate'
          ? 'encouraging'
          : decision.coachGoal === 'Stöd'
            ? 'supportive'
            : 'calm',
      maxWords: 80,
    },
  };
}

/** Structured JSON destined for a future server-side language service. */
export function serializeCoachPrompt(payload: CoachPromptPayload): string {
  return JSON.stringify(payload, null, 2);
}
