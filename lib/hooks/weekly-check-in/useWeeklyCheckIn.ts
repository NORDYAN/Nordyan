import { useCallback, useEffect, useRef, useState } from 'react';

import type { WeeklyCheckInAnswerField } from '@/lib/domain/weekly-check-in';
import type {
  WeeklyCheckInAnswerValue,
  WeeklyCheckInFormAnswers,
  WeeklyCheckInStep,
} from '@/lib/presentation/weekly-check-in';
import {
  WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE,
  WEEKLY_CHECK_IN_SUBMIT_ERROR_MESSAGE,
  advanceWeeklyCheckInStep,
  canAdvanceWeeklyCheckInQuestion,
  canSubmitWeeklyCheckInForm,
  prefillWeeklyCheckInForm,
  retreatWeeklyCheckInStep,
  selectWeeklyCheckInAnswer,
  submitWeeklyCheckInForm,
} from '@/lib/presentation/weekly-check-in';
import { weeklyCheckInService } from '@/lib/services/weekly-check-in';
import type { WeeklyCheckInService } from '@/lib/services/weekly-check-in/weekly-check-in.service.types';
import { useAuth } from '@/providers/auth-provider';
import { syncWeeklyCheckInReminderForUser } from '@/lib/presentation/notifications/sync-nordyan-notifications.runtime';

type UseWeeklyCheckInOptions = {
  service?: WeeklyCheckInService;
};

export type WeeklyCheckInLoadStatus = 'loading' | 'ready' | 'error';

export type UseWeeklyCheckInResult = {
  loadStatus: WeeklyCheckInLoadStatus;
  loadError: string | null;
  step: WeeklyCheckInStep;
  answers: WeeklyCheckInFormAnswers;
  saving: boolean;
  saveError: string | null;
  canAdvance: boolean;
  canSubmit: boolean;
  start: () => void;
  goBack: () => void;
  goNext: () => void;
  selectAnswer: (field: WeeklyCheckInAnswerField, value: WeeklyCheckInAnswerValue) => void;
  submit: () => Promise<void>;
  retryLoad: () => Promise<void>;
};

export function useWeeklyCheckIn(options?: UseWeeklyCheckInOptions): UseWeeklyCheckInResult {
  const service = options?.service ?? weeklyCheckInService;
  const { session, isReady } = useAuth();
  const [loadStatus, setLoadStatus] = useState<WeeklyCheckInLoadStatus>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [step, setStep] = useState<WeeklyCheckInStep>({ kind: 'intro' });
  const [answers, setAnswers] = useState<WeeklyCheckInFormAnswers>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const sessionUserId = session?.user.id ?? null;

  const loadCurrentWeek = useCallback(
    async (options?: { cancelled?: () => boolean }) => {
      if (!isReady) {
        return;
      }

      const userId = sessionUserId;
      if (!userId) {
        if (options?.cancelled?.()) {
          return;
        }
        setLoadStatus('error');
        setLoadError(WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE());
        return;
      }

      setLoadStatus('loading');
      setLoadError(null);

      const result = await service.getCurrentWeek(userId);
      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setLoadStatus('error');
        setLoadError(WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE());
        return;
      }

      setAnswers(
        result.value.status === 'ready' ? prefillWeeklyCheckInForm(result.value.checkIn) : {},
      );
      setStep({ kind: 'intro' });
      setSaveError(null);
      setLoadStatus('ready');
    },
    [isReady, service, sessionUserId],
  );

  const loadCurrentWeekRef = useRef(loadCurrentWeek);
  loadCurrentWeekRef.current = loadCurrentWeek;

  useEffect(() => {
    let cancelled = false;
    void loadCurrentWeek({ cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [loadCurrentWeek]);

  const start = useCallback(() => {
    setStep((current) => advanceWeeklyCheckInStep(current, answers));
  }, [answers]);

  const goBack = useCallback(() => {
    setSaveError(null);
    setStep((current) => retreatWeeklyCheckInStep(current));
  }, []);

  const goNext = useCallback(() => {
    setSaveError(null);
    setStep((current) => advanceWeeklyCheckInStep(current, answers));
  }, [answers]);

  const selectAnswer = useCallback(
    (field: WeeklyCheckInAnswerField, value: WeeklyCheckInAnswerValue) => {
      setAnswers((current) => selectWeeklyCheckInAnswer(current, field, value));
    },
    [],
  );

  const submit = useCallback(async () => {
    if (saving || !sessionUserId || !canSubmitWeeklyCheckInForm(answers)) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await submitWeeklyCheckInForm(service, sessionUserId, answers);
    if (!result.ok) {
      setSaving(false);
      setSaveError(WEEKLY_CHECK_IN_SUBMIT_ERROR_MESSAGE());
      return;
    }

    setSaving(false);
    setStep({ kind: 'success' });
    void syncWeeklyCheckInReminderForUser(sessionUserId);
  }, [answers, saving, service, sessionUserId]);

  const retryLoad = useCallback(async () => {
    await loadCurrentWeekRef.current();
  }, []);

  const questionIndex = step.kind === 'question' ? step.index : 0;

  return {
    loadStatus,
    loadError,
    step,
    answers,
    saving,
    saveError,
    canAdvance: canAdvanceWeeklyCheckInQuestion(answers, questionIndex),
    canSubmit: canSubmitWeeklyCheckInForm(answers),
    start,
    goBack,
    goNext,
    selectAnswer,
    submit,
    retryLoad,
  };
}
