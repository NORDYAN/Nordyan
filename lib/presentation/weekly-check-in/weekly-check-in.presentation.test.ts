import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../../core';
import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '../../domain/weekly-check-in';

import {
  WEEKLY_CHECK_IN_INCOMPLETE_MESSAGE,
  WEEKLY_CHECK_IN_QUESTION_COUNT,
  WEEKLY_CHECK_IN_QUESTIONS,
  advanceWeeklyCheckInStep,
  canAdvanceWeeklyCheckInQuestion,
  canSubmitWeeklyCheckInForm,
  findWeeklyCheckInOptionValue,
  formatWeeklyCheckInProgress,
  getWeeklyCheckInQuestionFields,
  prefillWeeklyCheckInForm,
  retreatWeeklyCheckInStep,
  selectWeeklyCheckInAnswer,
  submitWeeklyCheckInForm,
  toWeeklyCheckInSubmitPayload,
  weeklyCheckInFormHasOnlyAnswerFields,
} from './weekly-check-in.presentation';
import { weeklyCheckInResponsiveLayout } from './weekly-check-in.layout';
import type { WeeklyCheckInFormAnswers, WeeklyCheckInStep } from './weekly-check-in.types';

const completeAnswers: WeeklyCheckInAnswers = {
  sleepQuality: 4,
  energy: 3,
  stress: 1,
  trainingFrequency: 'once',
  everydayActivity: 4,
  eatingQuality: 3,
  alcoholConsumption: 'none',
  planAdherence: 4,
};

const existingCheckIn: WeeklyCheckIn = {
  id: 'row-1',
  userId: 'user-1',
  weekStartDate: '2026-08-10',
  ...completeAnswers,
  createdAt: '2026-08-10T08:00:00.000Z',
  updatedAt: '2026-08-10T08:00:00.000Z',
};

function walkForm(
  selections: Array<{ field: keyof WeeklyCheckInAnswers; label: string }>,
): WeeklyCheckInFormAnswers {
  return selections.reduce<WeeklyCheckInFormAnswers>((form, selection) => {
    const value = findWeeklyCheckInOptionValue(selection.field, selection.label);
    assert.ok(value !== null, `missing mapping for ${selection.field} / ${selection.label}`);
    return selectWeeklyCheckInAnswer(form, selection.field, value);
  }, {});
}

describe('Weekly Check-in Figma/domain mapping', () => {
  it('exposes exactly eight approved questions and domain fields', () => {
    assert.equal(WEEKLY_CHECK_IN_QUESTIONS.length, WEEKLY_CHECK_IN_QUESTION_COUNT);
    assert.equal(WEEKLY_CHECK_IN_QUESTION_COUNT, 8);
    assert.deepEqual(getWeeklyCheckInQuestionFields(), [
      'sleepQuality',
      'energy',
      'stress',
      'trainingFrequency',
      'everydayActivity',
      'eatingQuality',
      'alcoholConsumption',
      'planAdherence',
    ]);
  });

  it('does not introduce mood, aches/pain or overall wellbeing fields', () => {
    const fields = getWeeklyCheckInQuestionFields();
    const titles = WEEKLY_CHECK_IN_QUESTIONS.map((question) => question.title);
    assert.equal(fields.includes('mood' as never), false);
    assert.equal(fields.includes('aches' as never), false);
    assert.equal(fields.includes('pain' as never), false);
    assert.equal(fields.includes('overallWellbeing' as never), false);
    assert.equal(
      titles.some((title) => title.includes('humör') || title.includes('värk') || title.includes('sammantaget')),
      false,
    );
  });

  it('maps sleep, energy, everyday activity, eating and plan labels to 1–5', () => {
    assert.equal(findWeeklyCheckInOptionValue('sleepQuality', 'Mycket bra'), 5);
    assert.equal(findWeeklyCheckInOptionValue('sleepQuality', 'Mycket dåligt'), 1);
    assert.equal(findWeeklyCheckInOptionValue('energy', 'Mycket hög'), 5);
    assert.equal(findWeeklyCheckInOptionValue('energy', 'Mycket låg'), 1);
    assert.equal(findWeeklyCheckInOptionValue('everydayActivity', 'Mycket aktiv'), 5);
    assert.equal(findWeeklyCheckInOptionValue('everydayActivity', 'Nästan inte alls'), 1);
    assert.equal(findWeeklyCheckInOptionValue('eatingQuality', 'Mycket bra'), 5);
    assert.equal(findWeeklyCheckInOptionValue('eatingQuality', 'Mycket dåligt'), 1);
    assert.equal(findWeeklyCheckInOptionValue('planAdherence', 'Mycket bra'), 5);
    assert.equal(findWeeklyCheckInOptionValue('planAdherence', 'Inte alls'), 1);
  });

  it('preserves stress polarity: Inte alls → 1, Mycket → 5', () => {
    assert.equal(findWeeklyCheckInOptionValue('stress', 'Inte alls'), 1);
    assert.equal(findWeeklyCheckInOptionValue('stress', 'Lite'), 2);
    assert.equal(findWeeklyCheckInOptionValue('stress', 'Måttligt'), 3);
    assert.equal(findWeeklyCheckInOptionValue('stress', 'Ganska mycket'), 4);
    assert.equal(findWeeklyCheckInOptionValue('stress', 'Mycket'), 5);
  });

  it('maps training display labels to domain enums, not 1–5', () => {
    assert.equal(findWeeklyCheckInOptionValue('trainingFrequency', 'Ingen'), 'none');
    assert.equal(findWeeklyCheckInOptionValue('trainingFrequency', '1 gång'), 'once');
    assert.equal(findWeeklyCheckInOptionValue('trainingFrequency', '2 gånger'), 'twice');
    assert.equal(findWeeklyCheckInOptionValue('trainingFrequency', '3 gånger'), 'three');
    assert.equal(findWeeklyCheckInOptionValue('trainingFrequency', '4+ gånger'), 'four_plus');
    assert.equal(typeof findWeeklyCheckInOptionValue('trainingFrequency', 'Ingen'), 'string');
  });

  it('maps alcohol display labels to domain enums without risk labels', () => {
    assert.equal(findWeeklyCheckInOptionValue('alcoholConsumption', 'Ingen'), 'none');
    assert.equal(findWeeklyCheckInOptionValue('alcoholConsumption', '1–3 glas'), '1_3');
    assert.equal(findWeeklyCheckInOptionValue('alcoholConsumption', '4–7 glas'), '4_7');
    assert.equal(findWeeklyCheckInOptionValue('alcoholConsumption', '8–14 glas'), '8_14');
    assert.equal(findWeeklyCheckInOptionValue('alcoholConsumption', '15+ glas'), '15_plus');
    const alcoholLabels = WEEKLY_CHECK_IN_QUESTIONS[6].options.map((option) => option.label);
    assert.equal(
      alcoholLabels.some((label) => /risk|skadlig|beroende|diagnos/i.test(label)),
      false,
    );
  });
});

describe('Weekly Check-in form navigation', () => {
  it('keeps selected answers when moving back and next', () => {
    let form: WeeklyCheckInFormAnswers = {};
    let step: WeeklyCheckInStep = { kind: 'intro' };
    step = advanceWeeklyCheckInStep(step, form);
    assert.deepEqual(step, { kind: 'question', index: 0 });

    form = selectWeeklyCheckInAnswer(form, 'sleepQuality', 4);
    step = advanceWeeklyCheckInStep(step, form);
    form = selectWeeklyCheckInAnswer(form, 'energy', 3);
    step = advanceWeeklyCheckInStep(step, form);
    assert.deepEqual(step, { kind: 'question', index: 2 });

    step = retreatWeeklyCheckInStep(step);
    step = retreatWeeklyCheckInStep(step);
    assert.deepEqual(step, { kind: 'question', index: 0 });
    assert.equal(form.sleepQuality, 4);
    assert.equal(form.energy, 3);
    assert.equal(canAdvanceWeeklyCheckInQuestion(form, 0), true);
  });

  it('formats progress as 1 av 8 through 8 av 8', () => {
    assert.equal(formatWeeklyCheckInProgress(0), '1 av 8');
    assert.equal(formatWeeklyCheckInProgress(7), '8 av 8');
  });

  it('blocks final submit until all eight answers are present', () => {
    const incomplete = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
    ]);
    assert.equal(canSubmitWeeklyCheckInForm(incomplete), false);
    assert.equal(toWeeklyCheckInSubmitPayload(incomplete), null);
  });

  it('enables submit when all eight answers are complete', () => {
    const form = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
      { field: 'stress', label: 'Inte alls' },
      { field: 'trainingFrequency', label: '1 gång' },
      { field: 'everydayActivity', label: 'Ganska aktiv' },
      { field: 'eatingQuality', label: 'Okej' },
      { field: 'alcoholConsumption', label: 'Ingen' },
      { field: 'planAdherence', label: 'Bra' },
    ]);
    assert.equal(canSubmitWeeklyCheckInForm(form), true);
    assert.deepEqual(toWeeklyCheckInSubmitPayload(form), completeAnswers);
  });
});

describe('Weekly Check-in prefill', () => {
  it('maps an existing current-week record into all eight controls without internals', () => {
    const form = prefillWeeklyCheckInForm(existingCheckIn);
    assert.deepEqual(form, completeAnswers);
    assert.equal('id' in form, false);
    assert.equal('userId' in form, false);
    assert.equal('weekStartDate' in form, false);
    assert.equal('createdAt' in form, false);
    assert.equal('updatedAt' in form, false);
    assert.equal(canSubmitWeeklyCheckInForm(form), true);
  });
});

describe('Weekly Check-in save', () => {
  it('calls the service once with the exact eight-answer payload', async () => {
    const calls: unknown[] = [];
    const saved: WeeklyCheckIn = existingCheckIn;
    const result = await submitWeeklyCheckInForm(
      {
        saveCurrentWeek: async (userId, answers) => {
          calls.push({ userId, answers });
          return { ok: true, value: saved };
        },
      },
      'user-1',
      completeAnswers,
    );

    assert.equal(result.ok, true);
    assert.equal(calls.length, 1);
    assert.deepEqual(calls[0], { userId: 'user-1', answers: completeAnswers });
    assert.equal(weeklyCheckInFormHasOnlyAnswerFields(completeAnswers), true);
    assert.equal('healthScore' in completeAnswers, false);
    assert.equal('steps' in completeAnswers, false);
    assert.equal('deviceActivity' in completeAnswers, false);
  });

  it('does not call the service when the form is incomplete', async () => {
    let called = 0;
    const result = await submitWeeklyCheckInForm(
      {
        saveCurrentWeek: async () => {
          called += 1;
          return { ok: false, error: { code: 'UNKNOWN', message: 'should not run' } };
        },
      },
      'user-1',
      { sleepQuality: 4 },
    );

    assert.equal(called, 0);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, WEEKLY_CHECK_IN_INCOMPLETE_MESSAGE());
    }
  });

  it('enters success after a successful save and preserves answers on failure', async () => {
    const success = await submitWeeklyCheckInForm(
      {
        saveCurrentWeek: async () => ({ ok: true, value: existingCheckIn }),
      },
      'user-1',
      completeAnswers,
    );
    assert.equal(success.ok, true);

    const failure: Result<WeeklyCheckIn> = {
      ok: false,
      error: { code: 'NETWORK', message: 'Kunde inte spara veckokollen. Försök igen.' },
    };
    const failed = await submitWeeklyCheckInForm(
      {
        saveCurrentWeek: async () => failure,
      },
      'user-1',
      completeAnswers,
    );
    assert.equal(failed.ok, false);
    assert.deepEqual(completeAnswers.alcoholConsumption, 'none');
    assert.deepEqual(completeAnswers.stress, 1);
    assert.equal(canSubmitWeeklyCheckInForm(completeAnswers), true);
  });
});

describe('Weekly Check-in intro/success layout', () => {
  it('keeps intro and success scroll-safe without a fixed illustration slot height', () => {
    assert.equal(weeklyCheckInResponsiveLayout.introScrollable, true);
    assert.equal(weeklyCheckInResponsiveLayout.successScrollable, true);
    assert.equal(weeklyCheckInResponsiveLayout.illustrationFixedSlotHeight, null);
  });
});
