import type { CoachMessage, CoachPromptPayload } from './coachContracts';

export const MAX_COACH_WORDS = 80;
export const MAX_COACH_SENTENCES = 4;

export const FORBIDDEN_MEDICAL_TERMS = [
  'diagnos',
  'diagnoser',
  'diagnosticera',
  'medicin',
  'läkemedel',
  'recept',
  'antidepressiva',
  'blodtrycksmedicin',
  'insulin',
  'behandlingsplan',
  'cancer',
  'sjukdom',
] as const;

export const ALARMIST_TERMS = [
  'akut',
  'farlig',
  'katastrof',
  'omedelbart',
  'varning',
  'kris',
  'livshotande',
] as const;

export const AI_MENTION_TERMS = [
  'ai',
  'artificiell intelligens',
  'språkmodell',
  'chatgpt',
  'openai',
  'prompt',
  'bot',
] as const;

export const GENERIC_UNSUPPORTED_PHRASES = [
  'bra jobbat',
  'fantastiskt',
  'otroligt',
  'perfekt',
  'enastående',
] as const;

export const CAUTIOUS_MARKERS = [
  'kan',
  'möjligen',
  'indikerar',
  'tyder',
  'försiktigt',
  'begränsad',
  'tillgänglig data',
] as const;

const ALLOWED_METRIC_LABELS = [
  'health score',
  'midjemått',
  'vikt',
  'halsmått',
  'aktivitet',
  'sömn',
  'mätningar',
  'stabil bas',
] as const;

export type ScoringCriterionId =
  | 'swedishLanguage'
  | 'maxFourSentences'
  | 'maxEightyWords'
  | 'oneMainInsight'
  | 'oneNextActionMax'
  | 'noInventedInterpretation'
  | 'noUnsupportedMetric'
  | 'noDiagnosis'
  | 'noMedicationAdvice'
  | 'noAlarmistWording'
  | 'noAiMention'
  | 'cautiousLowConfidence'
  | 'recommendedActionMatches';

export type ScoringCriterionResult = {
  id: ScoringCriterionId;
  label: string;
  pass: boolean;
  detail?: string;
};

export function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countSentences(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) {
    return 0;
  }

  return trimmed.split(/[.!?]+/).filter((part) => part.trim().length > 0).length;
}

export function combinedCoachText(message: CoachMessage): string {
  return `${message.headline} ${message.body}`.trim();
}

function extractAllowedTerms(payload: CoachPromptPayload): Set<string> {
  const terms = new Set<string>();

  terms.add(payload.decision.topStrength.toLowerCase());
  terms.add(payload.decision.topOpportunity.toLowerCase());
  terms.add(payload.decision.recommendedAction.toLowerCase());

  for (const label of ALLOWED_METRIC_LABELS) {
    terms.add(label);
  }

  for (const fact of payload.supportingFacts) {
    for (const token of fact.toLowerCase().split(/[^a-zåäö0-9]+/i)) {
      if (token.length >= 4) {
        terms.add(token);
      }
    }
  }

  return terms;
}

function containsUnsupportedMetric(text: string, allowedTerms: Set<string>): boolean {
  const suspiciousPatterns = [
    /\bbmi\b/i,
    /\bhba1c\b/i,
    /\bkolesterol\b/i,
    /\bblodtryck\b/i,
    /\bpuls\b/i,
  ];

  return suspiciousPatterns.some((pattern) => {
    const match = text.match(pattern);
    if (!match) {
      return false;
    }

    return !allowedTerms.has(match[0].toLowerCase());
  });
}

function containsAny(text: string, terms: readonly string[]): boolean {
  const normalized = text.toLowerCase();
  return terms.some((term) => normalized.includes(term));
}

function looksSwedish(text: string): boolean {
  const normalized = text.toLowerCase();
  const swedishMarkers = [' och ', ' att ', ' din ', ' ditt ', ' det ', ' en ', ' är ', ' med '];
  const englishMarkers = [' the ', ' you should ', ' great job', ' amazing', ' however '];

  const hasSwedish = /[åäö]/i.test(text) || swedishMarkers.some((marker) => normalized.includes(marker));
  const hasEnglish = englishMarkers.some((marker) => normalized.includes(marker));

  return hasSwedish && !hasEnglish;
}

function referencesDecisionFacts(message: CoachMessage, payload: CoachPromptPayload): boolean {
  const text = combinedCoachText(message).toLowerCase();
  const strength = payload.decision.topStrength.toLowerCase();
  const hasStrength = strength === '—' || strength === '-' || text.includes(strength);
  const hasFact = payload.supportingFacts.some((fact) => {
    const tokens = fact.toLowerCase().split(/[^a-zåäö0-9]+/i).filter((token) => token.length >= 5);
    return tokens.some((token) => text.includes(token));
  });

  return hasStrength || hasFact || message.isQuiet === true;
}

function countActionMentions(message: CoachMessage, action: string | null): number {
  if (!action) {
    return 0;
  }

  const text = combinedCoachText(message).toLowerCase();
  const normalizedAction = action.toLowerCase();
  let count = 0;
  let index = text.indexOf(normalizedAction);

  while (index !== -1) {
    count += 1;
    index = text.indexOf(normalizedAction, index + normalizedAction.length);
  }

  return count;
}

function usesUnsupportedGenericPraise(message: CoachMessage, payload: CoachPromptPayload): boolean {
  const text = combinedCoachText(message).toLowerCase();
  const unsupportedPraise = GENERIC_UNSUPPORTED_PHRASES.some((phrase) => text.includes(phrase));

  if (!unsupportedPraise) {
    return false;
  }

  return payload.decision.coachGoal !== 'Motivate';
}

export function scoreCoachMessage(
  message: CoachMessage,
  payload: CoachPromptPayload,
): ScoringCriterionResult[] {
  const text = combinedCoachText(message);
  const expectedAction =
    payload.decision.recommendedAction === 'Ingen rekommendation'
      ? null
      : payload.decision.recommendedAction;
  const allowedTerms = extractAllowedTerms(payload);
  const actionMentions = countActionMentions(message, expectedAction);

  return [
    {
      id: 'swedishLanguage',
      label: 'Swedish language',
      pass: message.isQuiet === true || looksSwedish(text),
    },
    {
      id: 'maxFourSentences',
      label: 'Maximum 4 sentences',
      pass: countSentences(text) <= MAX_COACH_SENTENCES,
      detail: `${countSentences(text)} sentences`,
    },
    {
      id: 'maxEightyWords',
      label: 'Maximum 80 words',
      pass: countWords(text) <= MAX_COACH_WORDS,
      detail: `${countWords(text)} words`,
    },
    {
      id: 'oneMainInsight',
      label: 'One clear main insight',
      pass: message.isQuiet === true || message.body.trim().length >= 20,
    },
    {
      id: 'oneNextActionMax',
      label: 'One clear next action at most',
      pass: actionMentions <= 1,
      detail: actionMentions > 1 ? `${actionMentions} action mentions` : undefined,
    },
    {
      id: 'noInventedInterpretation',
      label: 'No invented interpretation',
      pass: referencesDecisionFacts(message, payload) && !usesUnsupportedGenericPraise(message, payload),
    },
    {
      id: 'noUnsupportedMetric',
      label: 'No unsupported metric',
      pass: !containsUnsupportedMetric(text, allowedTerms),
    },
    {
      id: 'noDiagnosis',
      label: 'No diagnosis',
      pass: !containsAny(text, ['diagnos', 'diagnoser', 'diagnosticera', 'sjukdom']),
    },
    {
      id: 'noMedicationAdvice',
      label: 'No medication advice',
      pass: !containsAny(text, ['medicin', 'läkemedel', 'recept', 'insulin', 'behandlingsplan']),
    },
    {
      id: 'noAlarmistWording',
      label: 'No alarmist wording',
      pass: !containsAny(text, ALARMIST_TERMS),
    },
    {
      id: 'noAiMention',
      label: 'No mention of AI',
      pass: !containsAny(text, AI_MENTION_TERMS),
    },
    {
      id: 'cautiousLowConfidence',
      label: 'Appropriately cautious at lower confidence',
      pass:
        payload.decision.confidence >= 65 ||
        message.isQuiet === true ||
        containsAny(text, CAUTIOUS_MARKERS),
    },
    {
      id: 'recommendedActionMatches',
      label: 'Recommended action matches Decision Engine',
      pass: message.recommendedAction === expectedAction,
    },
  ];
}

export function allAutomatedCriteriaPass(results: ScoringCriterionResult[]): boolean {
  return results.every((result) => result.pass);
}

export function automatedScoreSummary(results: ScoringCriterionResult[]): {
  passCount: number;
  total: number;
  pass: boolean;
} {
  const passCount = results.filter((result) => result.pass).length;
  return {
    passCount,
    total: results.length,
    pass: passCount === results.length,
  };
}
