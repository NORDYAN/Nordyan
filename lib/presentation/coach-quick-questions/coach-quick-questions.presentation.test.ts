import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { COACH_QUICK_QUESTION_BANK } from '../../domain/coach-quick-questions';
import { sparseNewUserSignals } from '../../domain/coach-quick-questions/coach-quick-question.fixtures';
import { setActiveLocale } from '../../i18n';
import { nb } from '../../i18n/resources/nb';
import { sv } from '../../i18n/resources/sv';

import { buildCoachQuickQuestionSlots, localizeCoachQuickQuestion } from './coach-quick-questions.presentation';
import { mapCoachQuickQuestionSignals } from './coach-quick-questions.signals';

afterEach(() => {
  setActiveLocale('sv');
});

describe('Coach quick-question presentation', () => {
  it('localizes selected questions without sending Swedish text in Bokmål', () => {
    const svSlots = buildCoachQuickQuestionSlots(sparseNewUserSignals(), 'sv');
    const nbSlots = buildCoachQuickQuestionSlots(sparseNewUserSignals(), 'nb');
    assert.deepEqual(
      svSlots.map((slot) => slot.id),
      nbSlots.map((slot) => slot.id),
    );
    for (let index = 0; index < svSlots.length; index += 1) {
      assert.notEqual(svSlots[index]?.question, nbSlots[index]?.question);
      const id = svSlots[index]?.id;
      const definition = COACH_QUICK_QUESTION_BANK.find((entry) => entry.id === id);
      assert.ok(definition);
      assert.equal(svSlots[index]?.question, sv[definition.copyKey]);
      assert.equal(nbSlots[index]?.question, nb[definition.copyKey]);
    }
  });

  it('keeps IDs language-independent', () => {
    assert.equal(
      localizeCoachQuickQuestion('health_overall', 'sv'),
      'Hur ser min hälsa ut just nu?',
    );
    assert.equal(
      localizeCoachQuickQuestion('health_overall', 'nb'),
      'Hvordan ser helsen min ut akkurat nå?',
    );
  });

  it('does not treat initial-lifestyle-only moderate sleep as current Weekly Check-in evidence', () => {
    const signals = mapCoachQuickQuestionSignals({
      hasHealthContext: true,
      focusType: 'maintain_current_path',
      development: { status: 'empty' },
      weeklyCheckIn: null,
      initialLifestyle: {
        source: 'onboarding_baseline_self_report',
        sleepQuality: { value: 3, polarity: 'higher_better', meaning: 'okay' },
        energy: { value: 3, polarity: 'higher_better', meaning: 'normal' },
        stress: { value: 3, polarity: 'higher_worse', meaning: 'moderate' },
        lessHealthyFoodFrequency: null,
        everydayActivity: { value: 3, polarity: 'higher_better', meaning: 'moderate' },
        eatingQuality: { value: 3, polarity: 'higher_better', meaning: 'okay' },
        alcoholConsumption: {
          value: 'none',
          meaning: 'no_drinks',
          kind: 'neutral_self_reported_bucket',
        },
      },
      bodyComposition: {
        status: 'unavailable',
        bodyFatPercent: null,
        estimationKind: 'unavailable',
      },
      bodyFatReference: {
        status: 'unavailable',
        unavailableReason: 'missing_body_fat_percent',
      },
    });
    assert.equal(signals.sleep.available, true);
    assert.equal(signals.sleep.fromWeeklyCheckIn, false);
    assert.equal(signals.training.available, false);
  });
});
