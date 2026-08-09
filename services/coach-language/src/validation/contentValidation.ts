import {
  type CoachMessage,
  type CoachPromptPayload,
  type NordyanCoachPromptVersion,
} from '../../../../shared/coach-language';

export const MAX_COACH_WORDS = 80;

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

const ALLOWED_METRIC_LABELS = [
  'Health Score',
  'Midjemått',
  'Vikt',
  'Halsmått',
  'Aktivitet',
  'Sömn',
  'Mätningar',
  'Stabil bas',
] as const;

export type CoachContentValidationResult =
  | { valid: true; message: CoachMessage }
  | { valid: false; reason: string };

function countWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

function combinedText(message: CoachMessage): string {
  return `${message.headline} ${message.body}`.trim();
}

function containsForbiddenMedicalLanguage(text: string): boolean {
  const normalized = text.toLowerCase();
  return FORBIDDEN_MEDICAL_TERMS.some((term) => normalized.includes(term));
}

function extractAllowedTerms(payload: CoachPromptPayload): Set<string> {
  const terms = new Set<string>();

  terms.add(payload.decision.topStrength.toLowerCase());
  terms.add(payload.decision.topOpportunity.toLowerCase());
  terms.add(payload.decision.recommendedAction.toLowerCase());

  for (const label of ALLOWED_METRIC_LABELS) {
    terms.add(label.toLowerCase());
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
    /\blångtidsminne\b/i,
    /\bblodtryck\b/i,
    /\bpuls\b/i,
  ];

  return suspiciousPatterns.some((pattern) => {
    const match = text.match(pattern);
    if (!match) {
      return false;
    }

    const term = match[0].toLowerCase();
    return !allowedTerms.has(term);
  });
}

export function validateCoachMessageSchema(raw: unknown): CoachMessage | null {
  if (typeof raw !== 'object' || raw === null) {
    return null;
  }

  const candidate = raw as Record<string, unknown>;

  if (
    typeof candidate.headline !== 'string' ||
    typeof candidate.body !== 'string' ||
    (candidate.recommendedAction !== null && typeof candidate.recommendedAction !== 'string') ||
    typeof candidate.tone !== 'string' ||
    typeof candidate.promptVersion !== 'string'
  ) {
    return null;
  }

  if (!['encouraging', 'supportive', 'neutral'].includes(candidate.tone)) {
    return null;
  }

  return {
    headline: candidate.headline,
    body: candidate.body,
    recommendedAction: candidate.recommendedAction,
    tone: candidate.tone as CoachMessage['tone'],
    promptVersion: candidate.promptVersion,
    isQuiet: candidate.isQuiet === true ? true : undefined,
  };
}

export function validateCoachMessageContent(
  message: CoachMessage,
  payload: CoachPromptPayload,
  expectedPromptVersion: NordyanCoachPromptVersion,
): CoachContentValidationResult {
  if (message.promptVersion !== expectedPromptVersion) {
    return { valid: false, reason: 'promptVersion mismatch' };
  }

  if (message.isQuiet) {
    return { valid: true, message };
  }

  if (!message.headline.trim() || !message.body.trim()) {
    return { valid: false, reason: 'empty headline or body' };
  }

  const text = combinedText(message);
  if (countWords(text) > MAX_COACH_WORDS) {
    return { valid: false, reason: 'word limit exceeded' };
  }

  if (containsForbiddenMedicalLanguage(text)) {
    return { valid: false, reason: 'forbidden medical language' };
  }

  const expectedAction =
    payload.decision.recommendedAction === 'Ingen rekommendation'
      ? null
      : payload.decision.recommendedAction;

  if (message.recommendedAction !== expectedAction) {
    return { valid: false, reason: 'recommendedAction mismatch' };
  }

  const allowedTerms = extractAllowedTerms(payload);
  if (containsUnsupportedMetric(text, allowedTerms)) {
    return { valid: false, reason: 'unsupported metric name' };
  }

  if (payload.decision.confidence < 65) {
    const cautiousMarkers = ['kan', 'möjligen', 'indikerar', 'tyder', 'försiktigt', 'begränsad'];
    const hasCautiousLanguage = cautiousMarkers.some((marker) => text.toLowerCase().includes(marker));
    if (!hasCautiousLanguage) {
      return { valid: false, reason: 'missing cautious language for low confidence' };
    }
  }

  return { valid: true, message };
}

export function parseCoachMessageJson(rawText: string): CoachMessage | null {
  try {
    return validateCoachMessageSchema(JSON.parse(rawText));
  } catch {
    return null;
  }
}
