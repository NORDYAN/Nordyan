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
  /** Defaults to generate for backward-compatible logs. */
  endpoint?: 'generate' | 'ask';
  openaiStatus?: string;
  incompleteReason?: string;
  completenessReason?: string;
  outputTokenCount?: number;
  answerCharCount?: number;
  retryAttempt?: number;
  /** Non-health request metadata. Ask v1.6 presentation locale only. */
  locale?: string;
  /** Non-health routing diagnostics. Never include request payload content. */
  requestVersion?: string;
  model?: string;
  responseSource?: 'ai' | 'unavailable';
};

/** Metadata-only logging — never payloads, health text, coach copy, or API keys. */
export function logCoachRequest(entry: CoachRequestLog): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  const endpoint = entry.endpoint ?? 'generate';

  const payload: Record<string, unknown> = {
    event: endpoint === 'ask' ? 'coach.ask' : 'coach.generate',
    endpoint,
    requestId: entry.requestId,
    promptVersion: entry.promptVersion,
    provider: entry.provider,
    latencyMs: entry.latencyMs,
    category: entry.category,
    usedFallback: entry.usedFallback ?? entry.category !== 'success',
  };

  if (entry.openaiStatus !== undefined) {
    payload.openaiStatus = entry.openaiStatus;
  }
  if (entry.incompleteReason !== undefined) {
    payload.incompleteReason = entry.incompleteReason;
  }
  if (entry.completenessReason !== undefined) {
    payload.completenessReason = entry.completenessReason;
  }
  if (entry.outputTokenCount !== undefined) {
    payload.outputTokenCount = entry.outputTokenCount;
  }
  if (entry.answerCharCount !== undefined) {
    payload.answerCharCount = entry.answerCharCount;
  }
  if (entry.retryAttempt !== undefined) {
    payload.retryAttempt = entry.retryAttempt;
  }
  if (entry.locale !== undefined) {
    payload.locale = entry.locale;
  }
  if (entry.requestVersion !== undefined) {
    payload.requestVersion = entry.requestVersion;
  }
  if (entry.model !== undefined) {
    payload.model = entry.model;
  }
  if (entry.responseSource !== undefined) {
    payload.responseSource = entry.responseSource;
  }

  console.info(JSON.stringify(payload));
}

export function createRequestId(): string {
  return `coach_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
