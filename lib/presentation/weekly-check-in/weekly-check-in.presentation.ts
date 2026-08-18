import type { Result } from '@/lib/core';
import {
  WEEKLY_CHECK_IN_ANSWER_FIELDS,
  weeklyCheckInAnswersValidator,
  type WeeklyCheckIn,
  type WeeklyCheckInAnswerField,
  type WeeklyCheckInAnswers,
} from '@/lib/domain/weekly-check-in';
import { liveArray, liveCopy, matchesTranslatedLabel, t } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n';
import type { WeeklyCheckInService } from '@/lib/services/weekly-check-in/weekly-check-in.service.types';

import type {
  WeeklyCheckInAnswerValue,
  WeeklyCheckInCopy,
  WeeklyCheckInFormAnswers,
  WeeklyCheckInQuestion,
  WeeklyCheckInStep,
} from './weekly-check-in.types';

export const WEEKLY_CHECK_IN_QUESTION_COUNT = 8;

export const WEEKLY_CHECK_IN_LOAD_ERROR_MESSAGE = () => t('weeklyCheckIn.loadError');
export const WEEKLY_CHECK_IN_SUBMIT_ERROR_MESSAGE = () => t('weeklyCheckIn.submitError');
export const WEEKLY_CHECK_IN_INCOMPLETE_MESSAGE = () => t('weeklyCheckIn.incomplete');

export const WEEKLY_CHECK_IN_COPY: WeeklyCheckInCopy = liveCopy({
  introEyebrow: () => t('weeklyCheckIn.intro.eyebrow'),
  introTitle: () => t('weeklyCheckIn.intro.title'),
  introSupporting: () => t('weeklyCheckIn.intro.supporting'),
  introExplanation: () => t('weeklyCheckIn.intro.explanation'),
  introTimeHint: () => t('weeklyCheckIn.intro.timeHint'),
  introStartCta: () => t('weeklyCheckIn.intro.start'),
  introDismissCta: () => t('weeklyCheckIn.intro.dismiss'),
  progressLabel: () => t('weeklyCheckIn.progressLabel'),
  successTitle: () => t('weeklyCheckIn.success.title'),
  successSupporting: () => t('weeklyCheckIn.success.supporting'),
  successExplanation: () => t('weeklyCheckIn.success.explanation'),
  successHomeCta: () => t('weeklyCheckIn.success.home'),
});

type WeeklyOptionDef = {
  labelKey: TranslationKey;
  value: WeeklyCheckInAnswerValue;
};

const WEEKLY_CHECK_IN_OPTION_DEFS: Record<WeeklyCheckInAnswerField, readonly WeeklyOptionDef[]> = {
  sleepQuality: [
    { labelKey: 'lifestyle.sleep.veryGood', value: 5 },
    { labelKey: 'lifestyle.sleep.good', value: 4 },
    { labelKey: 'lifestyle.sleep.ok', value: 3 },
    { labelKey: 'lifestyle.sleep.poor', value: 2 },
    { labelKey: 'lifestyle.sleep.veryPoor', value: 1 },
  ],
  energy: [
    { labelKey: 'lifestyle.energy.veryHigh', value: 5 },
    { labelKey: 'lifestyle.energy.high', value: 4 },
    { labelKey: 'lifestyle.energy.normal', value: 3 },
    { labelKey: 'lifestyle.energy.low', value: 2 },
    { labelKey: 'lifestyle.energy.veryLow', value: 1 },
  ],
  stress: [
    { labelKey: 'lifestyle.stress.notAtAll', value: 1 },
    { labelKey: 'lifestyle.stress.aLittle', value: 2 },
    { labelKey: 'lifestyle.stress.moderate', value: 3 },
    { labelKey: 'lifestyle.stress.quiteALot', value: 4 },
    { labelKey: 'lifestyle.stress.aLot', value: 5 },
  ],
  trainingFrequency: [
    { labelKey: 'weeklyCheckIn.training.none', value: 'none' },
    { labelKey: 'weeklyCheckIn.training.once', value: 'once' },
    { labelKey: 'weeklyCheckIn.training.twice', value: 'twice' },
    { labelKey: 'weeklyCheckIn.training.three', value: 'three' },
    { labelKey: 'weeklyCheckIn.training.fourPlus', value: 'four_plus' },
  ],
  everydayActivity: [
    { labelKey: 'lifestyle.activity.veryActive', value: 5 },
    { labelKey: 'lifestyle.activity.quiteActive', value: 4 },
    { labelKey: 'lifestyle.activity.moderate', value: 3 },
    { labelKey: 'lifestyle.activity.aLittle', value: 2 },
    { labelKey: 'lifestyle.activity.almostNone', value: 1 },
  ],
  eatingQuality: [
    { labelKey: 'lifestyle.eating.veryGood', value: 5 },
    { labelKey: 'lifestyle.eating.good', value: 4 },
    { labelKey: 'lifestyle.eating.ok', value: 3 },
    { labelKey: 'lifestyle.sleep.poor', value: 2 },
    { labelKey: 'weeklyCheckIn.eating.veryPoor', value: 1 },
  ],
  alcoholConsumption: [
    { labelKey: 'lifestyle.alcohol.none', value: 'none' },
    { labelKey: 'lifestyle.alcohol.1_3', value: '1_3' },
    { labelKey: 'lifestyle.alcohol.4_7', value: '4_7' },
    { labelKey: 'lifestyle.alcohol.8_14', value: '8_14' },
    { labelKey: 'lifestyle.alcohol.15plus', value: '15_plus' },
  ],
  planAdherence: [
    { labelKey: 'lifestyle.eating.veryGood', value: 5 },
    { labelKey: 'lifestyle.eating.good', value: 4 },
    { labelKey: 'lifestyle.eating.ok', value: 3 },
    { labelKey: 'lifestyle.sleep.poor', value: 2 },
    { labelKey: 'weeklyCheckIn.plan.notAtAll', value: 1 },
  ],
};

function localizeOptions(field: WeeklyCheckInAnswerField) {
  return WEEKLY_CHECK_IN_OPTION_DEFS[field].map((option) => ({
    label: t(option.labelKey),
    value: option.value,
  }));
}

export function getWeeklyCheckInQuestions(): readonly WeeklyCheckInQuestion[] {
  return [
    {
      number: 1,
      field: 'sleepQuality',
      title: t('weeklyCheckIn.sleep.title'),
      support: t('weeklyCheckIn.sleep.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('sleepQuality'),
    },
    {
      number: 2,
      field: 'energy',
      title: t('weeklyCheckIn.energy.title'),
      support: t('weeklyCheckIn.energy.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('energy'),
    },
    {
      number: 3,
      field: 'stress',
      title: t('weeklyCheckIn.stress.title'),
      support: t('weeklyCheckIn.stress.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('stress'),
    },
    {
      number: 4,
      field: 'trainingFrequency',
      title: t('weeklyCheckIn.training.title'),
      support: t('weeklyCheckIn.training.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('trainingFrequency'),
    },
    {
      number: 5,
      field: 'everydayActivity',
      title: t('weeklyCheckIn.activity.title'),
      support: t('weeklyCheckIn.activity.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('everydayActivity'),
    },
    {
      number: 6,
      field: 'eatingQuality',
      title: t('weeklyCheckIn.eating.title'),
      support: t('weeklyCheckIn.eating.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('eatingQuality'),
    },
    {
      number: 7,
      field: 'alcoholConsumption',
      title: t('weeklyCheckIn.alcohol.title'),
      support: t('weeklyCheckIn.alcohol.support'),
      cta: t('weeklyCheckIn.next'),
      isFinal: false,
      options: localizeOptions('alcoholConsumption'),
    },
    {
      number: 8,
      field: 'planAdherence',
      title: t('weeklyCheckIn.plan.title'),
      support: t('weeklyCheckIn.plan.support'),
      cta: t('weeklyCheckIn.submit'),
      isFinal: true,
      options: localizeOptions('planAdherence'),
    },
  ] as WeeklyCheckInQuestion[];
}

export const WEEKLY_CHECK_IN_QUESTIONS: readonly WeeklyCheckInQuestion[] = liveArray(
  getWeeklyCheckInQuestions,
);

export function getWeeklyCheckInQuestion(index: number): WeeklyCheckInQuestion | null {
  return getWeeklyCheckInQuestions()[index] ?? null;
}

export function formatWeeklyCheckInProgress(index: number): string {
  return t('common.progress', {
    current: index + 1,
    total: WEEKLY_CHECK_IN_QUESTION_COUNT,
  });
}

export function getWeeklyCheckInProgressFraction(index: number): number {
  return (index + 1) / WEEKLY_CHECK_IN_QUESTION_COUNT;
}

export function findWeeklyCheckInOptionValue(
  field: WeeklyCheckInAnswerField,
  label: string,
): WeeklyCheckInAnswerValue | null {
  const options = WEEKLY_CHECK_IN_OPTION_DEFS[field];
  if (!options) {
    return null;
  }

  return options.find((option) => matchesTranslatedLabel(label, option.labelKey))?.value ?? null;
}

export function selectWeeklyCheckInAnswer(
  form: WeeklyCheckInFormAnswers,
  field: WeeklyCheckInAnswerField,
  value: WeeklyCheckInAnswerValue,
): WeeklyCheckInFormAnswers {
  return { ...form, [field]: value };
}

export function isWeeklyCheckInQuestionAnswered(
  form: WeeklyCheckInFormAnswers,
  field: WeeklyCheckInAnswerField,
): boolean {
  return form[field] !== undefined;
}

export function canAdvanceWeeklyCheckInQuestion(
  form: WeeklyCheckInFormAnswers,
  index: number,
): boolean {
  const question = getWeeklyCheckInQuestion(index);
  if (!question) {
    return false;
  }

  return isWeeklyCheckInQuestionAnswered(form, question.field);
}

export function toWeeklyCheckInSubmitPayload(
  form: WeeklyCheckInFormAnswers,
): WeeklyCheckInAnswers | null {
  const validation = weeklyCheckInAnswersValidator.validate(form);
  return validation.valid ? validation.value : null;
}

export function canSubmitWeeklyCheckInForm(form: WeeklyCheckInFormAnswers): boolean {
  return toWeeklyCheckInSubmitPayload(form) !== null;
}

export function prefillWeeklyCheckInForm(checkIn: WeeklyCheckIn): WeeklyCheckInAnswers {
  return {
    sleepQuality: checkIn.sleepQuality,
    energy: checkIn.energy,
    stress: checkIn.stress,
    trainingFrequency: checkIn.trainingFrequency,
    everydayActivity: checkIn.everydayActivity,
    eatingQuality: checkIn.eatingQuality,
    alcoholConsumption: checkIn.alcoholConsumption,
    planAdherence: checkIn.planAdherence,
  };
}

export function advanceWeeklyCheckInStep(
  step: WeeklyCheckInStep,
  form: WeeklyCheckInFormAnswers,
): WeeklyCheckInStep {
  if (step.kind === 'intro') {
    return { kind: 'question', index: 0 };
  }

  if (step.kind === 'question' && canAdvanceWeeklyCheckInQuestion(form, step.index)) {
    const question = getWeeklyCheckInQuestion(step.index);
    if (question && !question.isFinal) {
      return { kind: 'question', index: step.index + 1 };
    }
  }

  return step;
}

export function retreatWeeklyCheckInStep(step: WeeklyCheckInStep): WeeklyCheckInStep {
  if (step.kind === 'question' && step.index === 0) {
    return { kind: 'intro' };
  }

  if (step.kind === 'question') {
    return { kind: 'question', index: step.index - 1 };
  }

  return step;
}

export async function submitWeeklyCheckInForm(
  service: Pick<WeeklyCheckInService, 'saveCurrentWeek'>,
  userId: string,
  form: WeeklyCheckInFormAnswers,
): Promise<Result<WeeklyCheckIn>> {
  const payload = toWeeklyCheckInSubmitPayload(form);
  if (!payload) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: t('weeklyCheckIn.incomplete') },
    };
  }

  return service.saveCurrentWeek(userId, payload);
}

export function getWeeklyCheckInQuestionFields(): WeeklyCheckInAnswerField[] {
  return WEEKLY_CHECK_IN_ANSWER_FIELDS.slice();
}

export function weeklyCheckInFormHasOnlyAnswerFields(
  payload: WeeklyCheckInAnswers,
): boolean {
  const keys = Object.keys(payload);
  return (
    keys.length === WEEKLY_CHECK_IN_ANSWER_FIELDS.length &&
    keys.every((key) => (WEEKLY_CHECK_IN_ANSWER_FIELDS as readonly string[]).includes(key))
  );
}
