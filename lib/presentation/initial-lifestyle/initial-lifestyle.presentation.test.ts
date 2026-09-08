import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../../domain/initial-lifestyle';
import {
  createMemoryPendingKeyValueStore,
  createPendingInitialLifestyleStore,
} from '../../onboarding/pending-initial-lifestyle-store';

import {
  getInitialLifestyleIncompleteMessage,
  INITIAL_LIFESTYLE_QUESTION_COUNT,
  INITIAL_LIFESTYLE_QUESTIONS,
  advanceInitialLifestyleStep,
  canAdvanceInitialLifestyleQuestion,
  canSubmitInitialLifestyleForm,
  findInitialLifestyleOptionValue,
  formatInitialLifestyleProgress,
  getInitialLifestyleQuestionFields,
  initialLifestyleFormHasOnlyAnswerFields,
  retreatInitialLifestyleStep,
  savePendingOnboardingInitialLifestyle,
  selectInitialLifestyleAnswer,
  toInitialLifestyleSubmitPayload,
} from './initial-lifestyle.presentation';
import type { InitialLifestyleFormAnswers, InitialLifestyleStep } from './initial-lifestyle.types';

const completeAnswers: InitialLifestyleAnswers = {
  sleepQuality: 4,
  energy: 3,
  stress: 1,
  lessHealthyFoodFrequency: 'once',
  everydayActivity: 4,
  eatingQuality: 3,
  alcoholConsumption: 'none',
};

function walkForm(
  selections: Array<{ field: keyof InitialLifestyleAnswers; label: string }>,
): InitialLifestyleFormAnswers {
  return selections.reduce<InitialLifestyleFormAnswers>((form, selection) => {
    const value = findInitialLifestyleOptionValue(selection.field, selection.label);
    assert.ok(value !== null, `missing mapping for ${selection.field} / ${selection.label}`);
    return selectInitialLifestyleAnswer(form, selection.field, value);
  }, {});
}

describe('Initial Lifestyle Figma/domain mapping', () => {
  it('exposes exactly seven approved questions and domain fields', () => {
    assert.equal(INITIAL_LIFESTYLE_QUESTIONS.length, INITIAL_LIFESTYLE_QUESTION_COUNT);
    assert.equal(INITIAL_LIFESTYLE_QUESTION_COUNT, 7);
    assert.deepEqual(getInitialLifestyleQuestionFields(), [
      'sleepQuality',
      'energy',
      'stress',
      'lessHealthyFoodFrequency',
      'everydayActivity',
      'eatingQuality',
      'alcoholConsumption',
    ]);
  });

  it('does not include planAdherence, trainingFrequency, or free text', () => {
    const fields = getInitialLifestyleQuestionFields();
    assert.equal(fields.includes('planAdherence' as never), false);
    assert.equal(fields.includes('trainingFrequency' as never), false);
    assert.equal(
      INITIAL_LIFESTYLE_QUESTIONS.every((question) => question.options.length >= 4),
      true,
    );
  });

  it('maps sleep labels explicitly: Mycket bra → 5 through Mycket dåligt → 1', () => {
    assert.equal(findInitialLifestyleOptionValue('sleepQuality', 'Mycket bra'), 5);
    assert.equal(findInitialLifestyleOptionValue('sleepQuality', 'Bra'), 4);
    assert.equal(findInitialLifestyleOptionValue('sleepQuality', 'Okej'), 3);
    assert.equal(findInitialLifestyleOptionValue('sleepQuality', 'Dåligt'), 2);
    assert.equal(findInitialLifestyleOptionValue('sleepQuality', 'Mycket dåligt'), 1);
  });

  it('maps energy labels explicitly: Mycket hög → 5 through Mycket låg → 1', () => {
    assert.equal(findInitialLifestyleOptionValue('energy', 'Mycket hög'), 5);
    assert.equal(findInitialLifestyleOptionValue('energy', 'Hög'), 4);
    assert.equal(findInitialLifestyleOptionValue('energy', 'Normal'), 3);
    assert.equal(findInitialLifestyleOptionValue('energy', 'Låg'), 2);
    assert.equal(findInitialLifestyleOptionValue('energy', 'Mycket låg'), 1);
  });

  it('preserves stress polarity higher_worse: Inte alls → 1, Mycket → 5', () => {
    assert.equal(findInitialLifestyleOptionValue('stress', 'Inte alls'), 1);
    assert.equal(findInitialLifestyleOptionValue('stress', 'Lite'), 2);
    assert.equal(findInitialLifestyleOptionValue('stress', 'Måttligt'), 3);
    assert.equal(findInitialLifestyleOptionValue('stress', 'Ganska mycket'), 4);
    assert.equal(findInitialLifestyleOptionValue('stress', 'Mycket'), 5);
  });

  it('does not invert stress by visual order', () => {
    const stress = INITIAL_LIFESTYLE_QUESTIONS.find((question) => question.field === 'stress');
    assert.ok(stress);
    assert.equal(stress.options[0]?.label, 'Inte alls');
    assert.equal(stress.options[0]?.value, 1);
    assert.equal(stress.options[4]?.label, 'Mycket');
    assert.equal(stress.options[4]?.value, 5);
  });

  it('maps less-healthy-food labels to domain buckets, not 1–5', () => {
    assert.equal(findInitialLifestyleOptionValue('lessHealthyFoodFrequency', 'Aldrig'), 'never');
    assert.equal(findInitialLifestyleOptionValue('lessHealthyFoodFrequency', '1 gång'), 'once');
    assert.equal(findInitialLifestyleOptionValue('lessHealthyFoodFrequency', '2–3 gånger'), 'two_three');
    assert.equal(findInitialLifestyleOptionValue('lessHealthyFoodFrequency', '4–6 gånger'), 'four_six');
    assert.equal(findInitialLifestyleOptionValue('lessHealthyFoodFrequency', 'Dagligen'), 'daily');
    assert.equal(
      typeof findInitialLifestyleOptionValue('lessHealthyFoodFrequency', 'Aldrig'),
      'string',
    );
    const foodQuestion = INITIAL_LIFESTYLE_QUESTIONS.find(
      (question) => question.field === 'lessHealthyFoodFrequency',
    );
    assert.ok(foodQuestion);
    assert.equal(
      foodQuestion.options.some((option) => /skräpmat/i.test(option.label)),
      false,
    );
    assert.equal(/skräpmat/i.test(foodQuestion.title), false);
  });

  it('maps everyday activity labels explicitly', () => {
    assert.equal(findInitialLifestyleOptionValue('everydayActivity', 'Mycket aktiv'), 5);
    assert.equal(findInitialLifestyleOptionValue('everydayActivity', 'Ganska aktiv'), 4);
    assert.equal(findInitialLifestyleOptionValue('everydayActivity', 'Lagom'), 3);
    assert.equal(findInitialLifestyleOptionValue('everydayActivity', 'Lite aktiv'), 2);
    assert.equal(findInitialLifestyleOptionValue('everydayActivity', 'Nästan inte alls'), 1);
  });

  it('maps eating labels including Mindre bra → 2 and Inte bra → 1', () => {
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Mycket bra'), 5);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Bra'), 4);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Okej'), 3);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Mindre bra'), 2);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Inte bra'), 1);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Dåligt'), null);
    assert.equal(findInitialLifestyleOptionValue('eatingQuality', 'Mycket dåligt'), null);
  });

  it('keeps eating quality distinct from less-healthy-food frequency', () => {
    assert.equal(INITIAL_LIFESTYLE_QUESTIONS[3]?.field, 'lessHealthyFoodFrequency');
    assert.equal(INITIAL_LIFESTYLE_QUESTIONS[5]?.field, 'eatingQuality');
    assert.notEqual(
      INITIAL_LIFESTYLE_QUESTIONS[3]?.title,
      INITIAL_LIFESTYLE_QUESTIONS[5]?.title,
    );
  });

  it('maps alcohol labels to domain buckets without judgment copy', () => {
    assert.equal(findInitialLifestyleOptionValue('alcoholConsumption', 'Ingen'), 'none');
    assert.equal(findInitialLifestyleOptionValue('alcoholConsumption', '1–3 glas'), '1_3');
    assert.equal(findInitialLifestyleOptionValue('alcoholConsumption', '4–7 glas'), '4_7');
    assert.equal(findInitialLifestyleOptionValue('alcoholConsumption', '8–14 glas'), '8_14');
    assert.equal(findInitialLifestyleOptionValue('alcoholConsumption', '15+ glas'), '15_plus');
    const alcoholLabels = INITIAL_LIFESTYLE_QUESTIONS[6].options.map((option) => option.label);
    assert.equal(
      alcoholLabels.some((label) => /risk|skadlig|beroende|diagnos/i.test(label)),
      false,
    );
  });
});

describe('Initial Lifestyle form navigation', () => {
  it('cannot advance an unanswered question', () => {
    const form: InitialLifestyleFormAnswers = {};
    let step: InitialLifestyleStep = { kind: 'question', index: 0 };

    assert.equal(canAdvanceInitialLifestyleQuestion(form, 0), false);
    step = advanceInitialLifestyleStep(step, form);
    assert.deepEqual(step, { kind: 'question', index: 0 });
  });

  it('preserves previous answers on Back and replacing a selection', () => {
    let form: InitialLifestyleFormAnswers = {};
    let step: InitialLifestyleStep = { kind: 'intro' };
    step = advanceInitialLifestyleStep(step, form);
    assert.deepEqual(step, { kind: 'question', index: 0 });

    form = selectInitialLifestyleAnswer(form, 'sleepQuality', 4);
    form = selectInitialLifestyleAnswer(form, 'sleepQuality', 5);
    assert.equal(form.sleepQuality, 5);

    step = advanceInitialLifestyleStep(step, form);
    form = selectInitialLifestyleAnswer(form, 'energy', 3);
    step = advanceInitialLifestyleStep(step, form);
    assert.deepEqual(step, { kind: 'question', index: 2 });

    step = retreatInitialLifestyleStep(step);
    step = retreatInitialLifestyleStep(step);
    assert.deepEqual(step, { kind: 'question', index: 0 });
    assert.equal(form.sleepQuality, 5);
    assert.equal(form.energy, 3);
    assert.equal(canAdvanceInitialLifestyleQuestion(form, 0), true);
  });

  it('formats progress as 1 av 7 through 7 av 7', () => {
    assert.equal(formatInitialLifestyleProgress(0), '1 av 7');
    assert.equal(formatInitialLifestyleProgress(6), '7 av 7');
  });

  it('validates only when all seven answers are present', () => {
    const incomplete = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
    ]);
    assert.equal(canSubmitInitialLifestyleForm(incomplete), false);
    assert.equal(toInitialLifestyleSubmitPayload(incomplete), null);

    const complete = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
      { field: 'stress', label: 'Inte alls' },
      { field: 'lessHealthyFoodFrequency', label: '1 gång' },
      { field: 'everydayActivity', label: 'Ganska aktiv' },
      { field: 'eatingQuality', label: 'Okej' },
      { field: 'alcoholConsumption', label: 'Ingen' },
    ]);
    assert.equal(canSubmitInitialLifestyleForm(complete), true);
    assert.deepEqual(toInitialLifestyleSubmitPayload(complete), completeAnswers);
    assert.equal(initialLifestyleFormHasOnlyAnswerFields(completeAnswers), true);
    assert.equal('planAdherence' in completeAnswers, false);
  });
});

describe('Initial Lifestyle pending save', () => {
  it('saves complete seven answers as pending and does not write during navigation', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const store = createPendingInitialLifestyleStore(storage);
    let form: InitialLifestyleFormAnswers = {};
    let step: InitialLifestyleStep = { kind: 'intro' };

    step = advanceInitialLifestyleStep(step, form);
    form = selectInitialLifestyleAnswer(form, 'sleepQuality', 4);
    step = advanceInitialLifestyleStep(step, form);
    assert.equal(await storage.getItem('@nordyan/pending_initial_lifestyle'), null);

    const incomplete = await savePendingOnboardingInitialLifestyle(store, form);
    assert.equal(incomplete.ok, false);
    if (!incomplete.ok) {
      assert.equal(incomplete.error.message, getInitialLifestyleIncompleteMessage());
    }
    assert.equal(await storage.getItem('@nordyan/pending_initial_lifestyle'), null);

    const complete = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
      { field: 'stress', label: 'Inte alls' },
      { field: 'lessHealthyFoodFrequency', label: '1 gång' },
      { field: 'everydayActivity', label: 'Ganska aktiv' },
      { field: 'eatingQuality', label: 'Okej' },
      { field: 'alcoholConsumption', label: 'Ingen' },
    ]);
    const saved = await savePendingOnboardingInitialLifestyle(store, complete);
    assert.equal(saved.ok, true);
    if (saved.ok) {
      assert.deepEqual(saved.value, completeAnswers);
    }
    assert.equal((await storage.getItem('@nordyan/pending_initial_lifestyle')) !== null, true);
  });

  it('requires all seven answers before a pending baseline can be saved', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const store = createPendingInitialLifestyleStore(storage);
    const sixAnswers = walkForm([
      { field: 'sleepQuality', label: 'Bra' },
      { field: 'energy', label: 'Normal' },
      { field: 'stress', label: 'Inte alls' },
      { field: 'lessHealthyFoodFrequency', label: '1 gång' },
      { field: 'everydayActivity', label: 'Ganska aktiv' },
      { field: 'eatingQuality', label: 'Okej' },
    ]);

    assert.equal(canSubmitInitialLifestyleForm(sixAnswers), false);
    const incomplete = await savePendingOnboardingInitialLifestyle(store, sixAnswers);
    assert.equal(incomplete.ok, false);
    assert.equal(await storage.getItem('@nordyan/pending_initial_lifestyle'), null);
  });
});
