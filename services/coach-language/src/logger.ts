import type { CoachLanguageProvider } from '../../../shared/coach-language';

export type CoachLogCategory =
  | 'success'
  | 'validation_error'
  | 'openai_error'
  | 'timeout'
  | 'fallback'
  | 'quiet'
  | 'auth_error'
  | 'rate_limited';

export type CoachRequestLog = {
  requestId: string;
  promptVersion: string;
  provider: CoachLanguageProvider;
  latencyMs: number;
  category: CoachLogCategory;
  usedFallback?: boolean;
};

/** Metadata-only logging — never payloads, health text, coach copy, or API keys. */
export function logCoachRequest(entry: CoachRequestLog): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  console.info(
    JSON.stringify({
      event: 'coach.generate',
      requestId: entry.requestId,
      promptVersion: entry.promptVersion,
      provider: entry.provider,
      latencyMs: entry.latencyMs,
      category: entry.category,
      usedFallback: entry.usedFallback ?? entry.category !== 'success',
    }),
  );
}

export function createRequestId(): string {
  return `coach_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
