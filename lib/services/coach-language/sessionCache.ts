/**
 * In-memory session cache for formulated Home coach messages.
 * Avoids duplicate OpenAI calls for the same recommendation within one JS session.
 * Not persisted — cleared on app reload.
 */

export type CoachLanguageCacheEntry = {
  message: string;
};

const messageCache = new Map<string, CoachLanguageCacheEntry>();
const inflight = new Map<string, Promise<string | null>>();
/** Keys for which a generate attempt finished (success or failure) this session. */
const completedAttempts = new Set<string>();

export function buildCoachLanguageCacheKey(input: {
  recommendationId: string;
  durationMinutes: number;
  frequencyPerWeek: number;
  primaryFocus: string;
}): string {
  return [
    input.recommendationId,
    input.durationMinutes,
    input.frequencyPerWeek,
    input.primaryFocus,
  ].join('|');
}

export function getCachedCoachLanguageMessage(key: string): string | null {
  return messageCache.get(key)?.message ?? null;
}

export function setCachedCoachLanguageMessage(key: string, message: string): void {
  messageCache.set(key, { message });
  completedAttempts.add(key);
}

/**
 * True when this session already finished a language request for the key
 * (success or failure). Prevents retry storms on remount / tab switch / 429.
 */
export function hasCompletedCoachLanguageAttempt(key: string): boolean {
  return completedAttempts.has(key) || messageCache.has(key);
}

export function markCoachLanguageAttemptComplete(key: string): void {
  completedAttempts.add(key);
}

export function getInflightCoachLanguageRequest(
  key: string,
): Promise<string | null> | undefined {
  return inflight.get(key);
}

export function setInflightCoachLanguageRequest(
  key: string,
  promise: Promise<string | null>,
): void {
  inflight.set(key, promise);
  void promise.finally(() => {
    inflight.delete(key);
  });
}

/** Test helper */
export function clearCoachLanguageSessionCache(): void {
  messageCache.clear();
  inflight.clear();
  completedAttempts.clear();
}
