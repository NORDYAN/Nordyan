import type {
  CoachPriority,
  CoachRecommendationCategory,
} from '@/lib/domain/coach-engine';
import type { FocusType } from '@/lib/domain/focus-engine';

/**
 * Minimal production decision surface for language formulation.
 * Contains no PII, no raw measurements, and no Supabase identifiers.
 */
export type ProductionCoachLanguageSource = {
  recommendationId: string;
  category: CoachRecommendationCategory;
  durationMinutes: number;
  frequencyPerWeek: number;
  priority: CoachPriority;
  /** Focus-engine confidence on a 0–1 scale. */
  confidence: number;
  primaryFocus: FocusType;
  /**
   * When true, no language request should be made.
   * Production coach-engine does not emit silence today; this covers unavailable Home states.
   */
  silence?: boolean;
};

export type CoachLanguageAdapterResult =
  | { ok: true; payload: import('@/shared/coach-language').CoachPromptPayload }
  | { ok: false; reason: 'silence' | 'invalid_source' };
