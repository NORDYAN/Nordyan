import type { CoachLanguageProvider } from '../shared/coachContracts';

export type CoachLogCategory =
  | 'success'
  | 'validation_error'
  | 'openai_error'
  | 'timeout'
  | 'fallback'
  | 'quiet';

export type CoachRequestLog = {
  requestId: string;
  promptVersion: string;
  provider: CoachLanguageProvider;
  latencyMs: number;
  category: CoachLogCategory;
};

/** Logs development metadata only — never payloads, health text, or API keys. */
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
    }),
  );
}

export function createRequestId(): string {
  return `coach_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
