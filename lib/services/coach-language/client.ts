import type {
  CoachGenerateResponse,
  CoachPromptPayload,
  NordyanCoachPromptVersion,
} from '@/shared/coach-language';
import { DEFAULT_NORDYAN_COACH_PROMPT_VERSION } from '@/shared/coach-language';

import { getCoachLanguageApiBaseUrl } from './env';

export type CoachLanguageClientResult =
  | { ok: true; value: CoachGenerateResponse }
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

export type RequestCoachLanguageOptions = {
  accessToken: string;
  payload: CoachPromptPayload;
  coachPromptVersion?: NordyanCoachPromptVersion;
  /** Abort / timeout in ms. Default 15000. */
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
};

/**
 * Authenticated client for the production coach language endpoint.
 * Never sends or stores OpenAI API keys.
 */
export async function requestCoachLanguage(
  options: RequestCoachLanguageOptions,
): Promise<CoachLanguageClientResult> {
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
    const response = await fetchImpl(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${options.accessToken}`,
      },
      body: JSON.stringify({
        ...options.payload,
        coachPromptVersion:
          options.coachPromptVersion ?? DEFAULT_NORDYAN_COACH_PROMPT_VERSION,
      }),
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

    const json = (await response.json()) as CoachGenerateResponse;
    if (
      !json ||
      typeof json !== 'object' ||
      !json.message ||
      !json.meta ||
      typeof json.message.body !== 'string'
    ) {
      return { ok: false, reason: 'invalid' };
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

/** True only when OpenAI formulation succeeded (not server template fallback). */
export function isSuccessfulOpenAiLanguageResponse(response: CoachGenerateResponse): boolean {
  return (
    response.meta.provider === 'openai' &&
    response.meta.validationStatus === 'valid' &&
    response.meta.usedFallback === false &&
    !response.message.isQuiet
  );
}
