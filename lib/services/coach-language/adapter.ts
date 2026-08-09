import type { CoachEngineResult } from '@/lib/domain/coach-engine';
import type { FocusType } from '@/lib/domain/focus-engine';
import { getCoachPresentation } from '@/lib/services/coach/coach.presentation';
import { getFocusPresentation } from '@/lib/services/focus';
import {
  COACH_PROMPT_PAYLOAD_VERSION,
  type CoachPromptPayload,
  FORBIDDEN_REQUEST_FIELDS,
} from '@/shared/coach-language';

import type { CoachLanguageAdapterResult, ProductionCoachLanguageSource } from './types';

const FORBIDDEN_FIELD_SET = new Set<string>(FORBIDDEN_REQUEST_FIELDS);

function mapCoachGoal(
  priority: ProductionCoachLanguageSource['priority'],
  category: ProductionCoachLanguageSource['category'],
): string {
  if (category === 'maintain' || category === 'recovery') {
    return 'Motivate';
  }

  if (priority === 'high') {
    return 'Guida';
  }

  if (priority === 'low') {
    return 'Stöd';
  }

  return 'Guida';
}

function mapTopStrength(category: ProductionCoachLanguageSource['category']): string {
  switch (category) {
    case 'walking':
    case 'general_activity':
    case 'strength_training':
      return 'Aktivitet';
    case 'measurement_follow_up':
      return 'Mätningar';
    case 'nutrition_habit':
      return 'Stabil bas';
    case 'recovery':
    case 'maintain':
      return 'Stabil bas';
    default:
      return 'Stabil bas';
  }
}

function mapTopOpportunity(primaryFocus: FocusType): string {
  return getFocusPresentation(primaryFocus).title;
}

function toConfidencePercent(confidence01: number): number {
  if (!Number.isFinite(confidence01)) {
    return 0;
  }

  const scaled = confidence01 <= 1 ? confidence01 * 100 : confidence01;
  return Math.round(Math.min(100, Math.max(0, scaled)));
}

function assertNoForbiddenKeys(value: unknown, path: string, violations: string[]): void {
  if (typeof value !== 'object' || value === null) {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenKeys(item, `${path}[${index}]`, violations));
    return;
  }

  for (const [key, child] of Object.entries(value)) {
    if (FORBIDDEN_FIELD_SET.has(key)) {
      violations.push(`${path}.${key}`);
    }
    assertNoForbiddenKeys(child, `${path}.${key}`, violations);
  }
}

/**
 * Maps a production coach decision into a privacy-safe language payload.
 * Does not reinterpret health data — only approved presentation + decision metadata.
 */
export function adaptCoachEngineResultToLanguagePayload(
  source: ProductionCoachLanguageSource,
  generatedAt: string = new Date().toISOString(),
): CoachLanguageAdapterResult {
  if (source.silence) {
    return { ok: false, reason: 'silence' };
  }

  if (
    !source.recommendationId.trim() ||
    !Number.isFinite(source.durationMinutes) ||
    source.durationMinutes <= 0 ||
    !Number.isFinite(source.frequencyPerWeek) ||
    source.frequencyPerWeek <= 0
  ) {
    return { ok: false, reason: 'invalid_source' };
  }

  const presentation = getCoachPresentation(
    source.recommendationId,
    source.durationMinutes,
    source.frequencyPerWeek,
  );

  // recommendedAction is locked to the production template description.
  // Validation requires the model to echo this exact action string.
  const recommendedAction = presentation.description;
  const coachGoal = mapCoachGoal(source.priority, source.category);
  const confidence = toConfidencePercent(source.confidence);

  const payload: CoachPromptPayload = {
    version: COACH_PROMPT_PAYLOAD_VERSION,
    locale: 'sv-SE',
    generatedAt,
    decision: {
      topStrength: mapTopStrength(source.category),
      topOpportunity: mapTopOpportunity(source.primaryFocus),
      coachGoal,
      recommendedAction,
      confidence,
      insufficientData: false,
      silenceEligible: false,
    },
    supportingFacts: [presentation.description, presentation.title],
    instructions: {
      role: 'NORDYAN Coach',
      tone: coachGoal === 'Motivate' ? 'encouraging' : coachGoal === 'Stöd' ? 'supportive' : 'neutral',
      maxWords: 80,
    },
  };

  const violations: string[] = [];
  assertNoForbiddenKeys(payload, 'payload', violations);
  if (violations.length > 0) {
    return { ok: false, reason: 'invalid_source' };
  }

  return { ok: true, payload };
}

export function productionSourceFromCoachEngineResult(
  result: CoachEngineResult,
  primaryFocus: FocusType,
): ProductionCoachLanguageSource {
  return {
    recommendationId: result.recommendationId,
    category: result.category,
    durationMinutes: result.durationMinutes,
    frequencyPerWeek: result.frequencyPerWeek,
    priority: result.priority,
    confidence: result.confidence,
    primaryFocus,
  };
}

export function assertPayloadHasNoPii(payload: CoachPromptPayload): string[] {
  const violations: string[] = [];
  assertNoForbiddenKeys(payload, 'payload', violations);

  const serialized = JSON.stringify(payload).toLowerCase();
  const suspicious = ['@', 'sk-', 'bearer ', 'user_id', 'supabase'];
  for (const token of suspicious) {
    if (serialized.includes(token)) {
      violations.push(`serialized:${token}`);
    }
  }

  return violations;
}
