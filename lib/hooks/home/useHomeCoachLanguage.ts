import { useEffect, useRef, useState } from 'react';

import {
  adaptCoachEngineResultToLanguagePayload,
  formatLanguageMessageForHome,
  isCoachLanguageApiConfigured,
  isSuccessfulOpenAiLanguageResponse,
  requestCoachLanguage,
  type ProductionCoachLanguageSource,
} from '@/lib/services/coach-language';
import {
  buildCoachLanguageCacheKey,
  getCachedCoachLanguageMessage,
  getInflightCoachLanguageRequest,
  hasCompletedCoachLanguageAttempt,
  markCoachLanguageAttemptComplete,
  setCachedCoachLanguageMessage,
  setInflightCoachLanguageRequest,
} from '@/lib/services/coach-language/sessionCache';
import { useAuth } from '@/providers/auth-provider';

type UseHomeCoachLanguageArgs = {
  templateMessage: string;
  languageSource: ProductionCoachLanguageSource | null;
  enabled: boolean;
};

type UseHomeCoachLanguageResult = {
  message: string;
  isFormulating: boolean;
  usedAiFormulation: boolean;
};

/**
 * Shows the production template immediately, then optionally replaces it with
 * validated OpenAI wording. Failures keep the template — never surface errors.
 * Identical recommendation state reuses a session cache (no duplicate OpenAI calls).
 * Failed attempts are not retried for the same key until the app session restarts.
 */
export function useHomeCoachLanguage({
  templateMessage,
  languageSource,
  enabled,
}: UseHomeCoachLanguageArgs): UseHomeCoachLanguageResult {
  const { session } = useAuth();
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [isFormulating, setIsFormulating] = useState(false);
  const activeKeyRef = useRef<string | null>(null);

  const recommendationId = languageSource?.recommendationId;
  const durationMinutes = languageSource?.durationMinutes;
  const frequencyPerWeek = languageSource?.frequencyPerWeek;
  const primaryFocus = languageSource?.primaryFocus;
  const silence = languageSource?.silence;
  const accessToken = session?.accessToken;
  const languageSourceRef = useRef(languageSource);
  languageSourceRef.current = languageSource;

  useEffect(() => {
    const source = languageSourceRef.current;

    if (!enabled || !source || silence) {
      activeKeyRef.current = null;
      setAiMessage(null);
      setIsFormulating(false);
      return;
    }

    if (
      recommendationId === undefined ||
      durationMinutes === undefined ||
      frequencyPerWeek === undefined ||
      primaryFocus === undefined
    ) {
      setAiMessage(null);
      setIsFormulating(false);
      return;
    }

    const requestKey = buildCoachLanguageCacheKey({
      recommendationId,
      durationMinutes,
      frequencyPerWeek,
      primaryFocus,
    });
    activeKeyRef.current = requestKey;

    const cached = getCachedCoachLanguageMessage(requestKey);
    if (cached) {
      setAiMessage(cached);
      setIsFormulating(false);
      return;
    }

    // New recommendation state: show template until a successful AI result arrives.
    setAiMessage(null);

    // Same state already attempted this session (including failures / 429) — do not retry.
    if (hasCompletedCoachLanguageAttempt(requestKey)) {
      setIsFormulating(false);
      return;
    }

    if (!isCoachLanguageApiConfigured()) {
      setIsFormulating(false);
      return;
    }

    if (!accessToken) {
      setIsFormulating(false);
      return;
    }

    const adapted = adaptCoachEngineResultToLanguagePayload(source);
    if (!adapted.ok) {
      setIsFormulating(false);
      return;
    }

    let cancelled = false;
    setIsFormulating(true);

    const existingInflight = getInflightCoachLanguageRequest(requestKey);
    const run =
      existingInflight ??
      (() => {
        const promise = (async (): Promise<string | null> => {
          try {
            const result = await requestCoachLanguage({
              accessToken,
              payload: adapted.payload,
            });

            if (!result.ok || !isSuccessfulOpenAiLanguageResponse(result.value)) {
              return null;
            }

            const formatted = formatLanguageMessageForHome(result.value.message);
            setCachedCoachLanguageMessage(requestKey, formatted);
            return formatted;
          } finally {
            markCoachLanguageAttemptComplete(requestKey);
          }
        })();

        setInflightCoachLanguageRequest(requestKey, promise);
        return promise;
      })();

    void run.then((formatted) => {
      if (cancelled || activeKeyRef.current !== requestKey) {
        return;
      }

      setIsFormulating(false);
      if (formatted) {
        setAiMessage(formatted);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [
    enabled,
    silence,
    recommendationId,
    durationMinutes,
    frequencyPerWeek,
    primaryFocus,
    accessToken,
  ]);

  return {
    message: aiMessage ?? templateMessage,
    isFormulating,
    usedAiFormulation: aiMessage !== null,
  };
}
