import {
  type CoachPromptPayload,
  type NordyanCoachPromptVersion,
} from '../../shared/coachContracts';
import { getCoachInstructionBundle } from '../instructions';

function mapTone(coachGoal: string): 'encouraging' | 'supportive' | 'neutral' {
  if (coachGoal === 'Motivate') {
    return 'encouraging';
  }

  if (coachGoal === 'Stöd') {
    return 'supportive';
  }

  return 'neutral';
}

function strengthLine(strength: string): string {
  switch (strength) {
    case 'Midjemått':
      return 'Midjemåttet visar en positiv riktning.';
    case 'Aktivitet':
      return 'Aktiviteten är en tydlig styrka just nu.';
    case 'Health Score':
      return 'Health Score behöver extra uppmärksamhet den här perioden.';
    case 'Stabil bas':
      return 'Du håller en stabil bas.';
    default:
      return `${strength} är det viktigaste att lyfta just nu.`;
  }
}

function opportunityLine(opportunity: string): string {
  switch (opportunity) {
    case 'Sömn':
      return 'Prioritera mer sömn de kommande veckorna.';
    case 'Aktivitet':
      return 'Öka daglig rörelse lite i taget.';
    case 'Mätningar':
      return 'Registrera en ny mätning för en mer träffsäker bild.';
    default:
      return `Fokusera på ${opportunity.toLowerCase()} som nästa steg.`;
  }
}

/** Deterministic fallback — uses only the approved decision payload. */
export function generateFallbackCoachMessage(
  payload: CoachPromptPayload,
  coachPromptVersion: NordyanCoachPromptVersion,
): import('../../shared/coachContracts').CoachMessage {
  const { decision } = payload;

  if (decision.insufficientData || decision.coachGoal === 'Tiga') {
    return generateQuietCoachMessage(coachPromptVersion);
  }

  const recommendedAction =
    decision.recommendedAction === 'Ingen rekommendation' ? null : decision.recommendedAction;

  const primaryFact = payload.supportingFacts[0] ?? strengthLine(decision.topStrength);
  const actionLine = recommendedAction ?? opportunityLine(decision.topOpportunity);
  const cautiousPrefix = decision.confidence < 65 ? 'Utifrån tillgänglig data kan ' : '';

  const headline =
    decision.coachGoal === 'Stöd'
      ? 'Vi tar det steg för steg.'
      : decision.coachGoal === 'Motivate'
        ? 'Du är på rätt väg.'
        : decision.coachGoal === 'Guida' && decision.recommendedAction === 'Bekräfta stabil trend'
          ? 'Din utveckling är stabil.'
          : 'Det viktigaste just nu är att hålla kursen.';

  const body = `${cautiousPrefix}${primaryFact} ${actionLine}`.trim();

  return {
    headline,
    body,
    recommendedAction,
    tone: mapTone(decision.coachGoal),
    promptVersion: coachPromptVersion,
  };
}

export function generateQuietCoachMessage(
  coachPromptVersion: NordyanCoachPromptVersion,
): import('../../shared/coachContracts').CoachMessage {
  return {
    headline: 'Ingen rekommendation',
    body: 'Otillräcklig data för personlig rekommendation.',
    recommendedAction: null,
    tone: 'neutral',
    promptVersion: coachPromptVersion,
    isQuiet: true,
  };
}

export function getInstructionSummary(version: NordyanCoachPromptVersion): string {
  return getCoachInstructionBundle(version).systemInstructions.slice(0, 120);
}
