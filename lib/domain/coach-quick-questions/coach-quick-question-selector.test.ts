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
import { recordCoachQuickQuestionTrioShown } from './coach-quick-question-rotation';
import {
  isCoachQuickQuestionEligible,
  selectCoachQuickQuestions,
} from './coach-quick-question-selector';
import {
  COACH_QUICK_QUESTION_IDS,
  type CoachQuickQuestionId,
  type CoachQuickQuestionRotationState,
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

  it('exposes SV and NB presentation for every selected id', () => {
    const signals = [sparseNewUserSignals(), noSleepEvidenceSignals(), healthyMaintainSignals()];
    for (const profile of signals) {
      for (const id of selectCoachQuickQuestions(profile).ids) {
        const definition = COACH_QUICK_QUESTION_BANK.find((entry) => entry.id === id);
        assert.ok(definition);
        assert.ok(sv[definition.copyKey].length > 0);
        assert.ok(nb[definition.copyKey].length > 0);
      }
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

  it('gives a sparse new user three useful mixed-intent questions without history', () => {
    const ids = selectCoachQuickQuestions(sparseNewUserSignals()).ids;
    assert.deepEqual([...ids], [
      'health_score_main_driver',
      'sleep_improve',
      'health_overall',
    ]);
    assert.deepEqual(topicFamilies(ids, sparseNewUserSignals()), [
      'health_score',
      'sleep',
      'general',
    ]);
  });

  it('selects three different topic families when the eligible pool allows it', () => {
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
      assert.equal(new Set(families).size, 3, families.join(','));
    }
  });

  it('surfaces body fat as the specific question when it is eligible', () => {
    const ids = [...selectCoachQuickQuestions(bodyCompositionConcernSignals()).ids];
    assert.equal(ids[0], 'body_fat_compare');
    assert.equal(ids.includes('health_overall'), true);
    assert.equal(ids.includes('body_fat_compare'), true);
  });

  it('ranks poor self-reported sleep as the behavior question', () => {
    assert.deepEqual([...selectCoachQuickQuestions(poorSleepSignals()).ids], [
      'health_score_main_driver',
      'sleep_improve',
      'health_overall',
    ]);
  });

  it('prefers stress_energy over generic recovery when both signals are relevant', () => {
    assert.deepEqual([...selectCoachQuickQuestions(highStressLowEnergySignals()).ids], [
      'health_score_main_driver',
      'stress_energy',
      'health_overall',
    ]);
  });

  it('ranks low everyday activity as the behavior question', () => {
    assert.deepEqual([...selectCoachQuickQuestions(lowEverydayActivitySignals()).ids], [
      'health_score_main_driver',
      'movement_enough',
      'health_overall',
    ]);
  });

  it('ranks little training as the behavior question', () => {
    assert.deepEqual([...selectCoachQuickQuestions(littleTrainingSignals()).ids], [
      'health_score_main_driver',
      'training_enough',
      'health_overall',
    ]);
  });

  it('ranks elevated alcohol with the neutral alcohol-health question', () => {
    assert.deepEqual([...selectCoachQuickQuestions(elevatedAlcoholSignals()).ids], [
      'health_score_main_driver',
      'alcohol_health',
      'health_overall',
    ]);
  });

  it('keeps healthy/maintain users on a data, behavior, and prioritization mix', () => {
    assert.deepEqual([...selectCoachQuickQuestions(healthyMaintainSignals()).ids], [
      'health_score_main_driver',
      'body_fat_reduce',
      'health_overall',
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
    assert.equal(ids.includes('movement_enough'), false);
    assert.equal(ids.includes('training_enough'), false);
    assert.equal(ids.includes('alcohol_health'), false);
    assert.deepEqual(ids, [
      'health_score_main_driver',
      'sleep_improve',
      'health_overall',
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
    const ids = [...selectCoachQuickQuestions(noSleepEvidenceSignals()).ids];
    assert.equal(ids.includes('sleep_improve'), false);
    assert.equal(ids.includes('movement_enough'), false);
    assert.equal(ids.includes('training_enough'), false);
    assert.equal(ids.includes('body_fat_compare'), false);
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
    assert.equal(
      selectCoachQuickQuestions({
        ...sparseNewUserSignals(),
        hasHealthContext: false,
      }).recordShown,
      false,
    );
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

  it('does not select body-fat questions without body-fat eligibility', () => {
    const ids = [...selectCoachQuickQuestions(sparseNewUserSignals()).ids];
    assert.equal(ids.includes('body_fat_compare'), false);
    assert.equal(ids.includes('body_fat_reduce'), false);
  });

  it('does not select a sleep-specific question without sleep context', () => {
    const ids = [...selectCoachQuickQuestions(noSleepEvidenceSignals()).ids];
    assert.equal(ids.includes('sleep_improve'), false);
    assert.deepEqual(ids, [
      'health_score_main_driver',
      'health_overall',
      'understand_my_data',
    ]);
  });
});

function daysAgo(days: number, now = new Date('2026-09-25T10:00:00.000Z')): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

function rotationAfterShowing(
  ids: readonly CoachQuickQuestionId[],
  shownAt: Date,
): CoachQuickQuestionRotationState {
  return recordCoachQuickQuestionTrioShown(null, ids, shownAt);
}

describe('Coach quick-question rotation', () => {
  const now = new Date('2026-09-25T10:00:00.000Z');

  it('avoids recently shown questions during the 7-day cooldown when alternatives exist', () => {
    const signals = healthyMaintainSignals();
    const first = selectCoachQuickQuestions(signals, { now: daysAgo(1, now) });
    const second = selectCoachQuickQuestions(signals, {
      now,
      rotation: rotationAfterShowing(first.ids, daysAgo(1, now)),
    });
    assert.deepEqual([...second.ids], [...first.ids]);
    assert.equal(second.recordShown, false);

    const afterSticky = selectCoachQuickQuestions(signals, {
      now,
      rotation: rotationAfterShowing(first.ids, daysAgo(7, now)),
    });
    assert.equal(afterSticky.ids.length, 3);
    assert.equal(afterSticky.ids.some((id) => first.ids.includes(id)), false);
    assert.equal(afterSticky.recordShown, true);
  });

  it('relaxes cooldown when necessary to still return 3 eligible questions', () => {
    const signals = noSleepEvidenceSignals();
    const first = selectCoachQuickQuestions(signals, { now: daysAgo(1, now) });
    assert.deepEqual([...first.ids], [
      'health_score_main_driver',
      'health_overall',
      'understand_my_data',
    ]);
    const second = selectCoachQuickQuestions(signals, {
      now,
      rotation: rotationAfterShowing(first.ids, daysAgo(1, now)),
    });
    assert.deepEqual([...second.ids], [...first.ids]);
  });

  it('is stable and deterministic for the same signals and rotation state', () => {
    const signals = poorSleepSignals();
    const rotation = rotationAfterShowing(
      ['health_score_main_driver', 'sleep_improve', 'health_overall'],
      daysAgo(2, now),
    );
    assert.deepEqual(
      [...selectCoachQuickQuestions(signals, { now, rotation }).ids],
      [...selectCoachQuickQuestions(signals, { now, rotation }).ids],
    );
  });

  it('makes previously shown questions eligible again after cooldown expires', () => {
    const signals = healthyMaintainSignals();
    const first = selectCoachQuickQuestions(signals, { now: daysAgo(14, now) });
    const rotated = selectCoachQuickQuestions(signals, {
      now: daysAgo(7, now),
      rotation: rotationAfterShowing(first.ids, daysAgo(14, now)),
    });
    assert.notDeepEqual([...rotated.ids], [...first.ids]);
    const returned = selectCoachQuickQuestions(signals, {
      now,
      rotation: recordCoachQuickQuestionTrioShown(
        rotationAfterShowing(first.ids, daysAgo(14, now)),
        rotated.ids,
        daysAgo(7, now),
      ),
    });
    assert.deepEqual([...returned.ids], [...first.ids]);
  });
});
