import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { nb } from '../../i18n/resources/nb';
import { sv } from '../../i18n/resources/sv';

import { COACH_QUICK_QUESTION_BANK } from './coach-quick-question-bank';
import {
  bodyCompositionConcernSignals,
  elevatedAlcoholSignals,
  healthyMaintainSignals,
  highStressLowEnergySignals,
  littleTrainingSignals,
  lowEverydayActivitySignals,
  noSleepEvidenceSignals,
  poorSleepSignals,
  sparseNewUserSignals,
} from './coach-quick-question.fixtures';
import {
  isCoachQuickQuestionEligible,
  selectCoachQuickQuestions,
} from './coach-quick-question-selector';
import {
  COACH_QUICK_QUESTION_IDS,
  type CoachQuickQuestionId,
  type CoachQuickQuestionSignals,
} from './coach-quick-question.types';

const FORBIDDEN_PHRASES = [
  'Vad ska jag göra idag?',
  'Vad ska jag fokusera på idag?',
  'Vad ska jag fokusera på den här veckan?',
  'Ge mig dagens plan',
  'Ge mig ett annat fokus',
  'Vad kan jag göra istället idag?',
  'Varför är detta mitt fokus?',
  'Hur kan jag göra planen mer effektiv?',
  'Vad bör jag prioritera idag?',
  'Hva skal jeg gjøre i dag?',
  'Hva kan jeg gjøre i stedet i dag?',
  'Hvorfor er dette fokuset mitt?',
  'steg',
  'steps',
  'labb',
  'blodprov',
  'Food Scanner',
  'matskanner',
];

function topicFamilies(ids: readonly CoachQuickQuestionId[], signals: CoachQuickQuestionSignals) {
  return ids.map((id) => {
    const definition = COACH_QUICK_QUESTION_BANK.find((entry) => entry.id === id);
    assert.ok(definition);
    assert.equal(isCoachQuickQuestionEligible(id, signals), true);
    return definition.topicFamily;
  });
}

describe('Coach quick-question bank', () => {
  it('keeps unique stable IDs covering the approved v1 set', () => {
    const ids = COACH_QUICK_QUESTION_BANK.map((entry) => entry.id);
    assert.deepEqual(ids, [...COACH_QUICK_QUESTION_IDS]);
    assert.equal(new Set(ids).size, ids.length);
    assert.ok(ids.length >= 12 && ids.length <= 16);
  });

  it('has Swedish and Bokmål copy for every bank question', () => {
    for (const entry of COACH_QUICK_QUESTION_BANK) {
      assert.equal(typeof sv[entry.copyKey], 'string');
      assert.ok(sv[entry.copyKey].length > 0);
      assert.equal(typeof nb[entry.copyKey], 'string');
      assert.ok(nb[entry.copyKey].length > 0);
      assert.notEqual(sv[entry.copyKey], nb[entry.copyKey]);
    }
  });

  it('omits forbidden action-plan, steps, lab, and device phrases', () => {
    const texts = COACH_QUICK_QUESTION_BANK.flatMap((entry) => [
      sv[entry.copyKey],
      nb[entry.copyKey],
    ]);
    for (const phrase of FORBIDDEN_PHRASES) {
      assert.equal(
        texts.some((text) => text.includes(phrase)),
        false,
        `forbidden phrase present: ${phrase}`,
      );
    }
  });
});

describe('Coach quick-question eligibility', () => {
  it('gates score-change, development, waist, weight, body fat, and lifestyle questions', () => {
    const sparse = sparseNewUserSignals();
    assert.equal(isCoachQuickQuestionEligible('health_score_main_driver', sparse), true);
    assert.equal(isCoachQuickQuestionEligible('health_score_change', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('development_recent', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('waist_development', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('weight_development', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('body_fat_compare', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('body_fat_reduce', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('training_enough', sparse), false);
    assert.equal(isCoachQuickQuestionEligible('sleep_improve', sparse), true);

    const noSleep = noSleepEvidenceSignals();
    assert.equal(isCoachQuickQuestionEligible('sleep_improve', noSleep), false);
    assert.equal(isCoachQuickQuestionEligible('recovery_understand', noSleep), false);
    assert.equal(isCoachQuickQuestionEligible('stress_energy', noSleep), false);
    assert.equal(isCoachQuickQuestionEligible('movement_enough', noSleep), false);
    assert.equal(isCoachQuickQuestionEligible('nutrition_improve', noSleep), false);
    assert.equal(isCoachQuickQuestionEligible('alcohol_health', noSleep), false);

    const body = bodyCompositionConcernSignals();
    assert.equal(isCoachQuickQuestionEligible('health_score_change', body), true);
    assert.equal(isCoachQuickQuestionEligible('development_recent', body), true);
    assert.equal(isCoachQuickQuestionEligible('waist_development', body), true);
    assert.equal(isCoachQuickQuestionEligible('body_fat_compare', body), true);
    assert.equal(isCoachQuickQuestionEligible('body_fat_reduce', body), true);
    assert.equal(isCoachQuickQuestionEligible('training_enough', body), true);

    const stressEnergy = highStressLowEnergySignals();
    assert.equal(isCoachQuickQuestionEligible('stress_energy', stressEnergy), true);
    assert.equal(isCoachQuickQuestionEligible('recovery_understand', stressEnergy), true);
  });
});

describe('Coach quick-question selection', () => {
  it('is deterministic for the same input', () => {
    const signals = poorSleepSignals();
    assert.deepEqual(selectCoachQuickQuestions(signals).ids, selectCoachQuickQuestions(signals).ids);
  });

  it('returns sparse health/general fallbacks for a new user', () => {
    const ids = selectCoachQuickQuestions(sparseNewUserSignals()).ids;
    assert.deepEqual([...ids], [
      'health_score_main_driver',
      'health_overall',
      'understand_my_data',
    ]);
  });

  it('surfaces body composition plus development plus Health Score/general', () => {
    assert.deepEqual([...selectCoachQuickQuestions(bodyCompositionConcernSignals()).ids], [
      'body_fat_compare',
      'development_recent',
      'health_score_main_driver',
    ]);
  });

  it('ranks poor self-reported sleep high', () => {
    assert.deepEqual([...selectCoachQuickQuestions(poorSleepSignals()).ids], [
      'sleep_improve',
      'recovery_understand',
      'health_score_main_driver',
    ]);
  });

  it('prefers stress_energy over generic recovery when both signals are relevant', () => {
    assert.deepEqual([...selectCoachQuickQuestions(highStressLowEnergySignals()).ids], [
      'stress_energy',
      'recovery_understand',
      'health_score_main_driver',
    ]);
  });

  it('ranks low everyday activity high and fills the rest with grounded generics', () => {
    assert.deepEqual([...selectCoachQuickQuestions(lowEverydayActivitySignals()).ids], [
      'movement_enough',
      'health_score_main_driver',
      'understand_my_data',
    ]);
  });

  it('ranks little training high and fills the rest with grounded generics', () => {
    assert.deepEqual([...selectCoachQuickQuestions(littleTrainingSignals()).ids], [
      'training_enough',
      'health_score_main_driver',
      'understand_my_data',
    ]);
  });

  it('ranks elevated alcohol with the neutral alcohol-health question', () => {
    assert.deepEqual([...selectCoachQuickQuestions(elevatedAlcoholSignals()).ids], [
      'alcohol_health',
      'health_score_main_driver',
      'understand_my_data',
    ]);
  });

  it('keeps healthy/maintain users on broad Health Score, development, and understanding', () => {
    assert.deepEqual([...selectCoachQuickQuestions(healthyMaintainSignals()).ids], [
      'health_score_main_driver',
      'development_recent',
      'understand_my_data',
    ]);
  });

  it('does not surface healthy sleep, movement, training, or alcohol just because data exists', () => {
    const healthyWci: CoachQuickQuestionSignals = {
      ...lowEverydayActivitySignals(),
      everydayActivity: { available: true, weak: false, fromWeeklyCheckIn: true },
      weeklyFocusImproveAreas: [],
      focusType: 'maintain_current_path',
    };
    const ids = [...selectCoachQuickQuestions(healthyWci).ids];
    assert.equal(ids.includes('sleep_improve'), false);
    assert.equal(ids.includes('movement_enough'), false);
    assert.equal(ids.includes('training_enough'), false);
    assert.equal(ids.includes('alcohol_health'), false);
    assert.deepEqual(ids, [
      'health_score_main_driver',
      'health_overall',
      'understand_my_data',
    ]);

    assert.equal(
      selectCoachQuickQuestions(lowEverydayActivitySignals()).ids.includes('sleep_improve'),
      false,
    );
    assert.equal(
      selectCoachQuickQuestions(littleTrainingSignals()).ids.includes('sleep_improve'),
      false,
    );
    assert.equal(
      selectCoachQuickQuestions(elevatedAlcoholSignals()).ids.includes('sleep_improve'),
      false,
    );
  });

  it('does not use an unsupported specific topic just to reach three chips', () => {
    const ids = [...selectCoachQuickQuestions(sparseNewUserSignals()).ids];
    assert.equal(ids.includes('sleep_improve'), false);
    assert.equal(ids.includes('movement_enough'), false);
    assert.equal(ids.includes('training_enough'), false);
    assert.equal(ids.length, 3);
  });

  it('does not show three questions from the same topic family', () => {
    const profiles: CoachQuickQuestionSignals[] = [
      sparseNewUserSignals(),
      bodyCompositionConcernSignals(),
      poorSleepSignals(),
      highStressLowEnergySignals(),
      lowEverydayActivitySignals(),
      littleTrainingSignals(),
      elevatedAlcoholSignals(),
      healthyMaintainSignals(),
    ];
    for (const signals of profiles) {
      const families = topicFamilies(selectCoachQuickQuestions(signals).ids, signals);
      const counts = new Map<string, number>();
      for (const family of families) {
        counts.set(family, (counts.get(family) ?? 0) + 1);
      }
      for (const [family, count] of counts) {
        if (family === 'general' || family === 'health_score' || family === 'recovery') {
          assert.ok(count <= 2, family);
          continue;
        }
        assert.ok(count <= 1, family);
      }
    }
  });

  it('returns no questions when Coach Ask cannot run', () => {
    assert.deepEqual(selectCoachQuickQuestions({
      ...sparseNewUserSignals(),
      hasHealthContext: false,
    }).ids, []);
  });

  it('does not surface unsupported sleep, and returns fewer than 3 when evidence is thin', () => {
    const ids = selectCoachQuickQuestions(noSleepEvidenceSignals()).ids;
    assert.equal(ids.includes('sleep_improve'), false);
    assert.deepEqual([...ids], [
      'health_score_main_driver',
      'health_overall',
      'understand_my_data',
    ]);
  });

  it('returns exactly 3 when sufficient evidence exists', () => {
    assert.equal(selectCoachQuickQuestions(healthyMaintainSignals()).ids.length, 3);
    assert.equal(selectCoachQuickQuestions(poorSleepSignals()).ids.length, 3);
  });
});
