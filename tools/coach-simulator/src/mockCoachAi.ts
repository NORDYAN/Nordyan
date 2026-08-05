import {
  NORDYAN_COACH_PROMPT_VERSION,
  type CoachMessage,
  type CoachPromptPayload,
} from '../shared/coachContracts';
import type { NordyanCoachPromptVersion } from '../shared/coachPromptVersions';

function mapTone(coachGoal: string): CoachMessage['tone'] {
  if (coachGoal === 'Motivate') {
    return 'encouraging';
  }

  if (coachGoal === 'Stöd') {
    return 'supportive';
  }

  return 'neutral';
}

function strengthSentence(strength: string): string {
  switch (strength) {
    case 'Midjemått':
      return 'Din största förbättring den senaste månaden är ditt midjemått.';
    case 'Vikt':
      return 'Din största förbättring den senaste månaden är din vikt.';
    case 'Halsmått':
      return 'Din största förbättring den senaste månaden är ditt halsmått.';
    case 'Aktivitet':
      return 'Din största förbättring den senaste månaden är din aktivitet.';
    case 'Health Score':
      return 'Din Health Score har sjunkit den senaste perioden.';
    case 'Stabil bas':
      return 'Du håller en stabil bas just nu.';
    default:
      return 'Du har tagit tydliga steg framåt den senaste månaden.';
  }
}

function opportunitySentence(opportunity: string): string {
  switch (opportunity) {
    case 'Sömn':
      return 'Om du prioriterar lite mer sömn de kommande veckorna har du goda möjligheter att fortsätta förbättra din Health Score.';
    case 'Aktivitet':
      return 'Om du ökar din dagliga rörelse lite de kommande veckorna har du goda möjligheter att fortsätta förbättra din Health Score.';
    case 'Midjemått':
      return 'Om du håller koll på midjemåttet de kommande veckorna har du goda möjligheter att fortsätta förbättra din Health Score.';
    case 'Mätningar':
      return 'Registrera en ny mätning så kan vi ge dig en mer träffsäker rekommendation.';
    default:
      return 'Små, konsekventa val de kommande veckorna kan ge dig fortsatt förbättring.';
  }
}

function openingHeadline(goal: string): string {
  if (goal === 'Tiga') {
    return 'Ingen rekommendation';
  }

  if (goal === 'Stöd') {
    return 'Vi tar det steg för steg.';
  }

  if (goal === 'Guida') {
    return 'Du ligger stabilt just nu.';
  }

  return 'Bra jobbat!';
}

/** Placeholder AI layer — local mock only, no network calls. */
export function generateMockCoachMessage(
  payload: CoachPromptPayload,
  coachPromptVersion: NordyanCoachPromptVersion = NORDYAN_COACH_PROMPT_VERSION,
): CoachMessage {
  const { decision } = payload;

  if (decision.insufficientData || decision.coachGoal === 'Tiga') {
    return {
      headline: 'Ingen rekommendation',
      body: 'Otillräcklig data för personlig rekommendation. Registrera fler mätningar och vanor för att aktivera NORDYAN Coach.',
      recommendedAction: null,
      tone: 'neutral',
      promptVersion: coachPromptVersion,
      isQuiet: true,
    };
  }

  const recommendedAction =
    decision.recommendedAction === 'Ingen rekommendation' ? null : decision.recommendedAction;

  if (decision.recommendedAction === 'Påminn om ny mätning') {
    return {
      headline: openingHeadline(decision.coachGoal),
      body: opportunitySentence(decision.topOpportunity),
      recommendedAction,
      tone: mapTone(decision.coachGoal),
      promptVersion: coachPromptVersion,
    };
  }

  if (decision.recommendedAction === 'Balansera motstridiga signaler') {
    return {
      headline: openingHeadline(decision.coachGoal),
      body: `${strengthSentence(decision.topStrength)} ${opportunitySentence(decision.topOpportunity)}`,
      recommendedAction,
      tone: mapTone(decision.coachGoal),
      promptVersion: coachPromptVersion,
    };
  }

  return {
    headline: openingHeadline(decision.coachGoal),
    body: `${strengthSentence(decision.topStrength)} ${opportunitySentence(decision.topOpportunity)}`,
    recommendedAction,
    tone: mapTone(decision.coachGoal),
    promptVersion: coachPromptVersion,
  };
}
