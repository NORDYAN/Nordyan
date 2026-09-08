import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useRef, useState } from 'react';

import type { InitialLifestyleAnswerField } from '@/lib/domain/initial-lifestyle';
import { emitOnboardingForensics } from '@/lib/onboarding/onboarding-forensics-emit';
import { getAnonymousOnboardingAttemptVersion } from '@/lib/onboarding/anonymous-onboarding-attempt';
import {
  getPendingLifestyleOwnerState,
  savePendingInitialLifestyle,
} from '@/lib/onboarding/pending-initial-lifestyle-storage';
import { useAuth } from '@/providers/auth-provider';
import type { PendingInitialLifestyleStore } from '@/lib/onboarding/pending-initial-lifestyle-store';
import {
  getInitialLifestyleIncompleteMessage,
  getInitialLifestylePendingSaveErrorMessage,
  advanceInitialLifestyleStep,
  canAdvanceInitialLifestyleQuestion,
  canSubmitInitialLifestyleForm,
  retreatInitialLifestyleStep,
  savePendingOnboardingInitialLifestyle,
  selectInitialLifestyleAnswer,
  type InitialLifestyleAnswerValue,
  type InitialLifestyleFormAnswers,
  type InitialLifestyleStep,
} from '@/lib/presentation/initial-lifestyle';

type PendingLifestyleStore = Pick<PendingInitialLifestyleStore, 'savePendingInitialLifestyle'>;

type UseOnboardingInitialLifestyleOptions = {
  onFinished: () => void;
  pendingStore?: PendingLifestyleStore;
};

export type UseOnboardingInitialLifestyleResult = {
  step: InitialLifestyleStep;
  answers: InitialLifestyleFormAnswers;
  saving: boolean;
  saveError: string | null;
  canAdvance: boolean;
  canSubmit: boolean;
  start: () => void;
  goBack: () => void;
  goNext: () => void;
  selectAnswer: (field: InitialLifestyleAnswerField, value: InitialLifestyleAnswerValue) => void;
  complete: () => Promise<void>;
};

export function useOnboardingInitialLifestyle(
  options: UseOnboardingInitialLifestyleOptions,
): UseOnboardingInitialLifestyleResult {
  const { status, session } = useAuth();
  const authenticated = status === 'authenticated';
  const viewerUserId = authenticated ? session?.user.id ?? null : null;
  const pendingStore = options.pendingStore ?? {
    savePendingInitialLifestyle,
  };

  const [step, setStep] = useState<InitialLifestyleStep>({ kind: 'intro' });
  const [answers, setAnswers] = useState<InitialLifestyleFormAnswers>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const attemptVersionRef = useRef(getAnonymousOnboardingAttemptVersion());

  useFocusEffect(
    useCallback(() => {
      const currentAttemptVersion = getAnonymousOnboardingAttemptVersion();
      if (attemptVersionRef.current === currentAttemptVersion) {
        return;
      }

      attemptVersionRef.current = currentAttemptVersion;
      setStep({ kind: 'intro' });
      setAnswers({});
      setSaving(false);
      setSaveError(null);
    }, []),
  );

  const start = useCallback(() => {
    setSaveError(null);
    setStep((current) => advanceInitialLifestyleStep(current, answers));
  }, [answers]);

  const goBack = useCallback(() => {
    setSaveError(null);
    setStep((current) => retreatInitialLifestyleStep(current));
  }, []);

  const goNext = useCallback(() => {
    setSaveError(null);
    setStep((current) => advanceInitialLifestyleStep(current, answers));
  }, [answers]);

  const selectAnswer = useCallback(
    (field: InitialLifestyleAnswerField, value: InitialLifestyleAnswerValue) => {
      setAnswers((current) => selectInitialLifestyleAnswer(current, field, value));
    },
    [],
  );

  const complete = useCallback(async () => {
    if (saving || !canSubmitInitialLifestyleForm(answers)) {
      return;
    }

    setSaving(true);
    setSaveError(null);

    const result = await savePendingOnboardingInitialLifestyle(pendingStore, answers);
    if (!result.ok) {
      setSaving(false);
      setSaveError(
        result.error.code === 'VALIDATION'
          ? getInitialLifestyleIncompleteMessage()
          : getInitialLifestylePendingSaveErrorMessage(),
      );
      return;
    }

    const lifestyleOwnerState = await getPendingLifestyleOwnerState();
    await emitOnboardingForensics({
      event: 'step-3-save',
      authenticated,
      viewerUserId,
      profileWriteResult: 'not_attempted',
      lifestyleWriteResult:
        lifestyleOwnerState === 'unowned'
          ? 'written'
          : lifestyleOwnerState === 'bound'
            ? 'ignored_bound'
            : 'not_attempted',
      visitIdPresent: false,
    });

    setSaving(false);
    options.onFinished();
  }, [answers, authenticated, options, pendingStore, saving, viewerUserId]);

  const questionIndex = step.kind === 'question' ? step.index : 0;

  return {
    step,
    answers,
    saving,
    saveError,
    canAdvance: canAdvanceInitialLifestyleQuestion(answers, questionIndex),
    canSubmit: canSubmitInitialLifestyleForm(answers),
    start,
    goBack,
    goNext,
    selectAnswer,
    complete,
  };
}
