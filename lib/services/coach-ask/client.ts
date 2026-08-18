import type { CoachAskRequest, CoachAskResponse } from '@/shared/coach-language';
import { getCoachLanguageApiBaseUrl } from '@/lib/services/coach-language/env';

export type CoachAskClientResult =
  | { ok: true; value: CoachAskResponse }
  | {
      ok: false;
      reason:
        | 'not_configured'
        | 'unauthorized'
        | 'timeout'
        | 'invalid'
        | 'network'
        | 'rejected'
        | 'rate_limited';
    };

export type RequestCoachAskOptions = {
  accessToken: string;
  request: CoachAskRequest;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Authenticated client for POST /api/coach/ask.
 * Separate from /api/coach/generate — never misuse generate for Q&A.
 */
export async function requestCoachAsk(
  options: RequestCoachAskOptions,
): Promise<CoachAskClientResult> {
  const baseUrl = getCoachLanguageApiBaseUrl();
  if (!baseUrl) {
    return { ok: false, reason: 'not_configured' };
  }

  if (!options.accessToken.trim()) {
    return { ok: false, reason: 'unauthorized' };
  }

  const timeoutMs = options.timeoutMs ?? 15_000;
  const fetchImpl = options.fetchImpl ?? fetch;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.info('[coach-ask] request metadata', {
        requestVersion: options.request.version,
        locale: options.request.locale,
      });
    }

    const response = await fetchImpl(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.accessToken}`,
      },
      body: JSON.stringify(options.request),
      signal: controller.signal,
    });

    if (response.status === 401 || response.status === 403) {
      return { ok: false, reason: 'unauthorized' };
    }

    if (response.status === 429) {
      return { ok: false, reason: 'rate_limited' };
    }

    if (!response.ok) {
      return { ok: false, reason: 'rejected' };
    }

    const json = (await response.json()) as CoachAskResponse;
    if (
      !json ||
      typeof json !== 'object' ||
      typeof json.answer !== 'string' ||
      !json.meta ||
      (json.meta.source !== 'ai' && json.meta.source !== 'unavailable') ||
      typeof json.meta.requestId !== 'string'
    ) {
      return { ok: false, reason: 'invalid' };
    }

    if (json.meta.source !== 'ai' || !json.answer.trim()) {
      return { ok: false, reason: 'rejected' };
    }

    return { ok: true, value: json };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return { ok: false, reason: 'timeout' };
    }
    return { ok: false, reason: 'network' };
  } finally {
    clearTimeout(timer);
  }
}

export function isCoachAskApiConfigured(): boolean {
  return getCoachLanguageApiBaseUrl() !== null;
}
