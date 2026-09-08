import type { Result } from '@/lib/core';
import {
  INITIAL_LIFESTYLE_ANSWER_FIELDS,
  initialLifestyleAnswersValidator,
  type InitialLifestyleAnswerField,
  type InitialLifestyleAnswers,
} from '@/lib/domain/initial-lifestyle';
import { liveArray, liveCopy, matchesTranslatedLabel, t } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import type { PendingInitialLifestyleStore } from '@/lib/onboarding/pending-initial-lifestyle-store';

import type {
  InitialLifestyleAnswerValue,
  InitialLifestyleCopy,
  InitialLifestyleFormAnswers,
  InitialLifestyleQuestion,
  InitialLifestyleStep,
} from './initial-lifestyle.types';

export const INITIAL_LIFESTYLE_QUESTION_COUNT = 7;

export function getInitialLifestyleIncompleteMessage(): string {
  return t('lifestyle.incomplete');
}

export function getInitialLifestylePendingSaveErrorMessage(): string {
  return t('lifestyle.pendingSaveError');
}

export function getInitialLifestyleSyncErrorMessage(): string {
  return t('lifestyle.syncError');
}

export const INITIAL_LIFESTYLE_COPY: InitialLifestyleCopy = liveCopy({
  introOverline: () => t('lifestyle.intro.overline'),
  introTitle: () => t('lifestyle.intro.title'),
  introBody: () => t('lifestyle.intro.body'),
  introTimeHint: () => t('lifestyle.intro.timeHint'),
  introStartCta: () => t('lifestyle.intro.start'),
});

type LifestyleOptionDef = {
  labelKey: TranslationKey;
  value: InitialLifestyleAnswerValue;
};

type LifestyleQuestionDef = Omit<InitialLifestyleQuestion, 'title' | 'support' | 'cta' | 'options'> & {
  titleKey: TranslationKey;
  supportKey: TranslationKey;
  ctaKey: TranslationKey;
  options: readonly LifestyleOptionDef[];
};

/**
 * Explicit label-key → domain value maps.
 * Visible labels are localized. Stored values never change with language.
 */
const INITIAL_LIFESTYLE_QUESTION_DEFS: readonly LifestyleQuestionDef[] = [
  {
    number: 1,
    field: 'sleepQuality',
    titleKey: 'lifestyle.sleep.title',
    supportKey: 'lifestyle.sleep.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.sleep.veryGood', value: 5 },
      { labelKey: 'lifestyle.sleep.good', value: 4 },
      { labelKey: 'lifestyle.sleep.ok', value: 3 },
      { labelKey: 'lifestyle.sleep.poor', value: 2 },
      { labelKey: 'lifestyle.sleep.veryPoor', value: 1 },
    ],
  },
  {
    number: 2,
    field: 'energy',
    titleKey: 'lifestyle.energy.title',
    supportKey: 'lifestyle.energy.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.energy.veryHigh', value: 5 },
      { labelKey: 'lifestyle.energy.high', value: 4 },
      { labelKey: 'lifestyle.energy.normal', value: 3 },
      { labelKey: 'lifestyle.energy.low', value: 2 },
      { labelKey: 'lifestyle.energy.veryLow', value: 1 },
    ],
  },
  {
    number: 3,
    field: 'stress',
    titleKey: 'lifestyle.stress.title',
    supportKey: 'lifestyle.stress.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.stress.notAtAll', value: 1 },
      { labelKey: 'lifestyle.stress.aLittle', value: 2 },
      { labelKey: 'lifestyle.stress.moderate', value: 3 },
      { labelKey: 'lifestyle.stress.quiteALot', value: 4 },
      { labelKey: 'lifestyle.stress.aLot', value: 5 },
    ],
  },
  {
    number: 4,
    field: 'lessHealthyFoodFrequency',
    titleKey: 'lifestyle.food.title',
    supportKey: 'lifestyle.food.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.food.never', value: 'never' },
      { labelKey: 'lifestyle.food.once', value: 'once' },
      { labelKey: 'lifestyle.food.twoThree', value: 'two_three' },
      { labelKey: 'lifestyle.food.fourSix', value: 'four_six' },
      { labelKey: 'lifestyle.food.daily', value: 'daily' },
    ],
  },
  {
    number: 5,
    field: 'everydayActivity',
    titleKey: 'lifestyle.activity.title',
    supportKey: 'lifestyle.activity.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.activity.veryActive', value: 5 },
      { labelKey: 'lifestyle.activity.quiteActive', value: 4 },
      { labelKey: 'lifestyle.activity.moderate', value: 3 },
      { labelKey: 'lifestyle.activity.aLittle', value: 2 },
      { labelKey: 'lifestyle.activity.almostNone', value: 1 },
    ],
  },
  {
    number: 6,
    field: 'eatingQuality',
    titleKey: 'lifestyle.eating.title',
    supportKey: 'lifestyle.eating.support',
    ctaKey: 'lifestyle.next',
    isFinal: false,
    options: [
      { labelKey: 'lifestyle.eating.veryGood', value: 5 },
      { labelKey: 'lifestyle.eating.good', value: 4 },
      { labelKey: 'lifestyle.eating.ok', value: 3 },
      { labelKey: 'lifestyle.eating.lessGood', value: 2 },
      { labelKey: 'lifestyle.eating.notGood', value: 1 },
    ],
  },
  {
    number: 7,
    field: 'alcoholConsumption',
    titleKey: 'lifestyle.alcohol.title',
    supportKey: 'lifestyle.alcohol.support',
    ctaKey: 'lifestyle.finish',
    isFinal: true,
    options: [
      { labelKey: 'lifestyle.alcohol.none', value: 'none' },
      { labelKey: 'lifestyle.alcohol.1_3', value: '1_3' },
      { labelKey: 'lifestyle.alcohol.4_7', value: '4_7' },
      { labelKey: 'lifestyle.alcohol.8_14', value: '8_14' },
      { labelKey: 'lifestyle.alcohol.15plus', value: '15_plus' },
    ],
  },
];

function localizeLifestyleQuestion(def: LifestyleQuestionDef): InitialLifestyleQuestion {
  return {
    number: def.number,
    field: def.field,
    title: t(def.titleKey),
    support: t(def.supportKey),
    cta: t(def.ctaKey),
    isFinal: def.isFinal,
    options: def.options.map((option) => ({
      label: t(option.labelKey),
      value: option.value,
    })),
  } as InitialLifestyleQuestion;
}

export function getInitialLifestyleQuestions(): readonly InitialLifestyleQuestion[] {
  return INITIAL_LIFESTYLE_QUESTION_DEFS.map(localizeLifestyleQuestion);
}

export const INITIAL_LIFESTYLE_QUESTIONS: readonly InitialLifestyleQuestion[] = liveArray(
  getInitialLifestyleQuestions,
);

export function getInitialLifestyleQuestion(index: number): InitialLifestyleQuestion | null {
  return getInitialLifestyleQuestions()[index] ?? null;
}

export function formatInitialLifestyleProgress(index: number): string {
  return t('common.progress', {
    current: index + 1,
    total: INITIAL_LIFESTYLE_QUESTION_COUNT,
  });
}

export function findInitialLifestyleOptionValue(
  field: InitialLifestyleAnswerField,
  label: string,
): InitialLifestyleAnswerValue | null {
  const question = INITIAL_LIFESTYLE_QUESTION_DEFS.find((item) => item.field === field);
  if (!question) {
    return null;
  }

  return (
    question.options.find((option) => matchesTranslatedLabel(label, option.labelKey))?.value ?? null
  );
}

export function selectInitialLifestyleAnswer(
  form: InitialLifestyleFormAnswers,
  field: InitialLifestyleAnswerField,
  value: InitialLifestyleAnswerValue,
): InitialLifestyleFormAnswers {
  return { ...form, [field]: value };
}

export function isInitialLifestyleQuestionAnswered(
  form: InitialLifestyleFormAnswers,
  field: InitialLifestyleAnswerField,
): boolean {
  return form[field] !== undefined;
}

export function canAdvanceInitialLifestyleQuestion(
  form: InitialLifestyleFormAnswers,
  index: number,
): boolean {
  const question = getInitialLifestyleQuestion(index);
  if (!question) {
    return false;
  }

  return isInitialLifestyleQuestionAnswered(form, question.field);
}

export function toInitialLifestyleSubmitPayload(
  form: InitialLifestyleFormAnswers,
): InitialLifestyleAnswers | null {
  const validation = initialLifestyleAnswersValidator.validate(form);
  return validation.valid ? validation.value : null;
}

export function canSubmitInitialLifestyleForm(form: InitialLifestyleFormAnswers): boolean {
  return toInitialLifestyleSubmitPayload(form) !== null;
}

export function advanceInitialLifestyleStep(
  step: InitialLifestyleStep,
  form: InitialLifestyleFormAnswers,
): InitialLifestyleStep {
  if (step.kind === 'intro') {
    return { kind: 'question', index: 0 };
  }

  if (step.kind === 'question' && canAdvanceInitialLifestyleQuestion(form, step.index)) {
    const question = getInitialLifestyleQuestion(step.index);
    if (question && !question.isFinal) {
      return { kind: 'question', index: step.index + 1 };
    }
  }

  return step;
}

export function retreatInitialLifestyleStep(step: InitialLifestyleStep): InitialLifestyleStep {
  if (step.kind === 'question' && step.index === 0) {
    return { kind: 'intro' };
  }

  if (step.kind === 'question') {
    return { kind: 'question', index: step.index - 1 };
  }

  return step;
}

export async function savePendingOnboardingInitialLifestyle(
  store: Pick<PendingInitialLifestyleStore, 'savePendingInitialLifestyle'>,
  form: InitialLifestyleFormAnswers,
): Promise<Result<InitialLifestyleAnswers>> {
  const payload = toInitialLifestyleSubmitPayload(form);
  if (!payload) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: t('lifestyle.incomplete') },
    };
  }

  return store.savePendingInitialLifestyle(payload);
}

export async function skipOnboardingInitialLifestyle(
  store: Pick<PendingInitialLifestyleStore, 'clearPendingInitialLifestyle'>,
): Promise<void> {
  await store.clearPendingInitialLifestyle();
}

export function getInitialLifestyleQuestionFields(): InitialLifestyleAnswerField[] {
  return INITIAL_LIFESTYLE_QUESTION_DEFS.map((question) => question.field);
}

export function initialLifestyleFormHasOnlyAnswerFields(
  payload: InitialLifestyleAnswers,
): boolean {
  const keys = Object.keys(payload);
  return (
    keys.length === INITIAL_LIFESTYLE_ANSWER_FIELDS.length &&
    keys.every((key) => (INITIAL_LIFESTYLE_ANSWER_FIELDS as readonly string[]).includes(key))
  );
}
