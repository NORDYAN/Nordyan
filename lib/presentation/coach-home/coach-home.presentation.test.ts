import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { CoachHomeSummary } from '../../services/coach-home';

import {
  getCoachHomeEmptyMessage,
  buildCoachHomeViewModel,
  isCoachHomeBodyFatComparisonQuestion,
  listCoachHomeReadySections,
  mapCoachHomeSummaryToFetchState,
  selectCoachHomeQuickQuestionSlots,
} from './coach-home.presentation';
import {
  COACH_HOME_CONTEXTUAL_QUESTION_CATALOG,
  COACH_HOME_SECTION_ORDER,
  COACH_HOME_STABLE_QUICK_QUESTIONS,
  COACH_HOME_SUGGESTED_QUESTIONS,
} from './coach-home.types';

const readySummary: Extract<CoachHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  focus: {
    type: 'improve_activity',
    title: 'Öka din aktivitet',
    subtitle: 'Mer regelbunden rörelse är din viktigaste förbättring just nu.',
  },
  plan: {
    available: true,
    recommendationId: 'activity_moderate_brisk_walk_v1',
    title: 'Rask promenad',
    description: 'Promenera 30 minuter i raskare tempo tre dagar den här veckan.',
    durationMinutes: 30,
    frequencyPerWeek: 3,
  },
};

describe('listCoachHomeReadySections', () => {
  it('places a single composer directly after identity, before Focus and Plan', () => {
    const order = listCoachHomeReadySections();
    assert.deepEqual([...order], [
      'identity',
      'composer',
      'focus',
      'plan',
      'quickQuestions',
    ]);
    assert.equal(order.filter((section) => section === 'composer').length, 1);
    assert.equal(COACH_HOME_SECTION_ORDER.filter((section) => section === 'composer').length, 1);
    assert.ok(order.indexOf('composer') < order.indexOf('focus'));
    assert.ok(order.indexOf('focus') < order.indexOf('plan'));
    assert.ok(order.indexOf('plan') < order.indexOf('quickQuestions'));
  });
});

describe('selectCoachHomeQuickQuestionSlots', () => {
  it('keeps three slots with stable outer questions and a contextual middle slot', () => {
    const slots = selectCoachHomeQuickQuestionSlots();
    assert.equal(slots.length, 3);
    assert.equal(slots[0]?.id, 'why-focus');
    assert.equal(slots[0]?.kind, 'stable');
    assert.equal(slots[0]?.question, COACH_HOME_STABLE_QUICK_QUESTIONS.whyFocus);
    assert.equal(slots[1]?.id, 'contextual');
    assert.equal(slots[1]?.kind, 'contextual');
    assert.equal(
      slots[1]?.question,
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
    );
    assert.equal(slots[2]?.id, 'instead-today');
    assert.equal(slots[2]?.kind, 'stable');
    assert.equal(slots[2]?.question, COACH_HOME_STABLE_QUICK_QUESTIONS.insteadToday);
  });

  it('replaces only the middle slot after the body-fat comparison question is used', () => {
    const slots = selectCoachHomeQuickQuestionSlots({ bodyFatComparisonUsed: true });
    assert.equal(slots.length, 3);
    assert.equal(slots[0]?.question, COACH_HOME_STABLE_QUICK_QUESTIONS.whyFocus);
    assert.equal(slots[1]?.kind, 'contextual');
    assert.equal(
      slots[1]?.question,
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.planMoreEffective,
    );
    assert.notEqual(
      slots[1]?.question,
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
    );
    assert.equal(slots[2]?.question, COACH_HOME_STABLE_QUICK_QUESTIONS.insteadToday);
  });

  it('does not treat the body-fat comparison question as a permanent daily chip', () => {
    const unused = selectCoachHomeQuickQuestionSlots();
    const used = selectCoachHomeQuickQuestionSlots({ bodyFatComparisonUsed: true });
    assert.equal(unused[1]?.id, 'contextual');
    assert.equal(used[1]?.id, 'contextual');
    assert.notEqual(unused[1]?.question, used[1]?.question);
  });
});

describe('isCoachHomeBodyFatComparisonQuestion', () => {
  it('matches the catalog body-fat comparison question', () => {
    assert.equal(
      isCoachHomeBodyFatComparisonQuestion(
        COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
      ),
      true,
    );
    assert.equal(
      isCoachHomeBodyFatComparisonQuestion(COACH_HOME_STABLE_QUICK_QUESTIONS.whyFocus),
      false,
    );
  });
});

describe('buildCoachHomeViewModel', () => {
  it('keeps Focus and Plan engine-derived content unchanged', () => {
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal(model.focus.sectionLabel, 'Ditt fokus just nu');
    assert.equal(model.focus.title, 'Öka din aktivitet');
    assert.equal(
      model.focus.body,
      'Mer regelbunden rörelse är din viktigaste förbättring just nu.',
    );
    assert.equal(model.plan.available, true);
    if (model.plan.available) {
      assert.equal(model.plan.sectionLabel, 'Din plan idag');
      assert.equal(model.plan.title, 'Rask promenad');
      assert.equal(
        model.plan.description,
        'Promenera 30 minuter i raskare tempo tre dagar den här veckan.',
      );
      assert.equal(model.plan.durationText, '30 min');
      assert.equal(model.plan.frequencyText, '3 gånger denna vecka');
    }
  });

  it('exposes a single primary composer and three default quick-question slots', () => {
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal(model.header.coachLabel, 'NORDYAN COACH');
    assert.equal(model.header.coachSubtitle, 'Din personliga hälsocoach');
    assert.equal(model.ask.sectionLabel, 'Fråga NORDYAN');
    assert.equal(model.ask.inputPlaceholder, 'Skriv din fråga…');
    assert.equal(model.ask.quickQuestionSlots.length, 3);
    assert.deepEqual(
      [...model.ask.suggestedQuestions],
      [...COACH_HOME_SUGGESTED_QUESTIONS],
    );
    assert.equal(model.ask.canAsk, true);
    assert.ok(model.ask.askContext);
    assert.equal(model.ask.askContext?.plan.recommendationId, 'activity_moderate_brisk_walk_v1');
  });

  it('disables ask when plan is unavailable without changing Focus', () => {
    const model = buildCoachHomeViewModel({
      ...readySummary,
      plan: { available: false, recommendationId: null },
    });
    assert.equal(model.focus.title, 'Öka din aktivitet');
    assert.equal(model.ask.canAsk, false);
    assert.equal(model.ask.askContext, null);
    assert.equal(model.ask.quickQuestionSlots.length, 3);
  });
});

describe('mapCoachHomeSummaryToFetchState', () => {
  it('maps empty without fake plan values', () => {
    assert.deepEqual(mapCoachHomeSummaryToFetchState({ status: 'empty' }), {
      status: 'empty',
      message: getCoachHomeEmptyMessage(),
    });
  });
});
