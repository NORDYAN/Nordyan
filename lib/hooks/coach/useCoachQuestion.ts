import { useCallback, useRef, useState } from 'react';

import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { isCoachAskApiConfigured, requestCoachAsk } from '@/lib/services/coach-ask';
import { coachContextService } from '@/lib/services/coach-context';
import { COACH_ASK_QUESTION_MAX_LENGTH } from '@/shared/coach-language';
import { useAuth } from '@/providers/auth-provider';

export type CoachQuestionUiState =
  | { status: 'idle' }
  | { status: 'unavailable'; message: string }
  | { status: 'pending'; question: string }
  | { status: 'success'; question: string; answer: string }
  | { status: 'error'; question: string; message: string };

type UseCoachQuestionResult = {
  askState: CoachQuestionUiState;
  submitQuestion: (question: string) => Promise<void>;
  resetAsk: () => void;
  isConfigured: boolean;
};

export function useCoachQuestion(): UseCoachQuestionResult {
  const { session } = useAuth();
  const { locale, isReady: isI18nReady } = useI18n();
  const pendingRef = useRef(false);
  const requestGenerationRef = useRef(0);
  const [askState, setAskState] = useState<CoachQuestionUiState>(() =>
    isCoachAskApiConfigured()
      ? { status: 'idle' }
      : { status: 'unavailable', message: t('coach.ask.unavailable') },
  );

  const resetAsk = useCallback(() => {
    requestGenerationRef.current += 1;
    pendingRef.current = false;
    setAskState(
      isCoachAskApiConfigured()
        ? { status: 'idle' }
        : { status: 'unavailable', message: t('coach.ask.unavailable') },
    );
  }, []);

  const submitQuestion = useCallback(
    async (rawQuestion: string) => {
      if (pendingRef.current) {
        return;
      }

      if (!isI18nReady) {
        setAskState({
          status: 'error',
          question: rawQuestion.trim(),
          message: t('coach.ask.error'),
        });
        return;
      }

      if (!isCoachAskApiConfigured()) {
        setAskState({ status: 'unavailable', message: t('coach.ask.unavailable') });
        return;
      }

      const question = rawQuestion.trim();
      if (!question) {
        return;
      }

      if (question.length > COACH_ASK_QUESTION_MAX_LENGTH) {
        setAskState({
          status: 'error',
          question,
          message: t('coach.ask.error'),
        });
        return;
      }

      const accessToken = session?.accessToken ?? '';
      const userId = session?.user.id ?? '';
      if (!accessToken || !userId) {
        setAskState({
          status: 'error',
          question,
          message: t('coach.ask.error'),
        });
        return;
      }

      pendingRef.current = true;
      const requestGeneration = requestGenerationRef.current;
      setAskState({ status: 'pending', question });

      try {
        const composed = await coachContextService.composeAskRequest(userId, question, locale);
        if (requestGenerationRef.current !== requestGeneration) {
          return;
        }
        if (!composed.ok || composed.value.status !== 'ready') {
          setAskState({
            status: 'error',
            question,
            message: t('coach.ask.error'),
          });
          return;
        }

        const result = await requestCoachAsk({
          accessToken,
          request: composed.value.request,
        });
        if (requestGenerationRef.current !== requestGeneration) {
          return;
        }

        if (!result.ok) {
          if (result.reason === 'not_configured') {
            setAskState({ status: 'unavailable', message: t('coach.ask.unavailable') });
            return;
          }
          setAskState({
            status: 'error',
            question,
            message: t('coach.ask.error'),
          });
          return;
        }

        setAskState({
          status: 'success',
          question,
          answer: result.value.answer.trim(),
        });
      } finally {
        if (requestGenerationRef.current === requestGeneration) {
          pendingRef.current = false;
        }
      }
    },
    [isI18nReady, locale, session?.accessToken, session?.user.id],
  );

  return {
    askState,
    submitQuestion,
    resetAsk,
    isConfigured: isCoachAskApiConfigured(),
  };
}
