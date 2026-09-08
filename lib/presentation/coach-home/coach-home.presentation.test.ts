import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { CoachHomeSummary } from '../../services/coach-home';
import { sparseNewUserSignals } from '../../domain/coach-quick-questions/coach-quick-question.fixtures';
import { setActiveLocale } from '../../i18n';

import {
  getCoachHomeEmptyMessage,
  buildCoachHomeViewModel,
  listCoachHomeReadySections,
  mapCoachHomeSummaryToFetchState,
  selectCoachHomeQuickQuestionSlots,
} from './coach-home.presentation';
import { COACH_HOME_SECTION_ORDER } from './coach-home.types';

afterEach(() => {
  setActiveLocale('sv');
});

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
  it('places the focus bridge after identity and before a single composer', () => {
    const order = listCoachHomeReadySections();
    assert.deepEqual([...order], [
      'identity',
      'focusBridge',
      'composer',
      'quickQuestions',
    ]);
    assert.equal(order.filter((section) => section === 'composer').length, 1);
    assert.equal(COACH_HOME_SECTION_ORDER.filter((section) => section === 'composer').length, 1);
    assert.ok(order.indexOf('composer') < order.indexOf('quickQuestions'));
  });
});

describe('selectCoachHomeQuickQuestionSlots', () => {
  it('selects three curated questions without legacy plan chips', () => {
    const slots = selectCoachHomeQuickQuestionSlots(sparseNewUserSignals());
    assert.equal(slots.length, 3);
    const questions = slots.map((slot) => slot.question).join('\n');
    assert.equal(questions.includes('Varför är detta mitt fokus?'), false);
    assert.equal(questions.includes('Vad kan jag göra istället idag?'), false);
    assert.equal(questions.includes('Hur kan jag göra planen mer effektiv?'), false);
    assert.equal(questions.includes('Vad bör jag prioritera idag?'), false);
  });
});

describe('buildCoachHomeViewModel', () => {
  it('keeps Ask ready when a plan exists, without Focus or Plan cards', () => {
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal('focus' in model, false);
    assert.equal('plan' in model, false);
    assert.equal(model.ask.canAsk, true);
    assert.equal(model.ask.askContext?.focus.type, 'improve_activity');
    assert.equal(model.ask.askContext?.plan.recommendationId, 'activity_moderate_brisk_walk_v1');
  });

  it('shows the Home focus bridge when existing Coach state confirms focus availability', () => {
    setActiveLocale('sv');
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal(model.focusBridge.visible, true);
    if (!model.focusBridge.visible) {
      throw new Error('expected visible focus bridge');
    }
    assert.equal(model.focusBridge.title, 'Jag har satt ditt fokus');
    assert.equal(
      model.focusBridge.body,
      'Jag har valt veckans fokus och dagens uppgift utifrån dina senaste uppgifter.',
    );
    assert.equal(model.focusBridge.ctaLabel, 'Se dagens fokus');
    assert.notEqual(model.focusBridge.title, readySummary.focus.title);
    assert.notEqual(model.focusBridge.body, readySummary.focus.subtitle);
    assert.notEqual(model.focusBridge.body, readySummary.plan.title);
  });

  it('localizes the Home focus bridge in Bokmål', () => {
    setActiveLocale('nb');
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal(model.focusBridge.visible, true);
    if (!model.focusBridge.visible) {
      throw new Error('expected visible focus bridge');
    }
    assert.equal(model.focusBridge.title, 'Jeg har satt fokuset ditt');
    assert.equal(
      model.focusBridge.body,
      'Jeg har valgt ukens fokus og dagens oppgave ut fra de siste opplysningene dine.',
    );
    assert.equal(model.focusBridge.ctaLabel, 'Se dagens fokus');
  });

  it('exposes a single primary composer and defers quick questions to evidence selection', () => {
    const model = buildCoachHomeViewModel(readySummary);
    assert.equal(model.header.coachLabel, 'NORDYAN COACH');
    assert.equal(model.header.coachSubtitle, 'Din personliga hälsocoach');
    assert.equal(model.ask.sectionLabel, 'Fråga NORDYAN');
    assert.equal(model.ask.inputPlaceholder, 'Skriv din fråga…');
    assert.equal(model.ask.quickQuestionsSectionLabel, 'Frågor för dig');
    assert.equal(model.ask.quickQuestionSlots.length, 0);
    assert.deepEqual([...model.ask.suggestedQuestions], []);
    assert.equal(model.ask.canAsk, true);
    assert.ok(model.ask.askContext);
    assert.equal(model.ask.askContext?.plan.recommendationId, 'activity_moderate_brisk_walk_v1');
  });

  it('disables ask when plan is unavailable', () => {
    const model = buildCoachHomeViewModel({
      ...readySummary,
      plan: { available: false, recommendationId: null },
    });
    assert.equal(model.ask.canAsk, false);
    assert.equal(model.ask.askContext, null);
    assert.equal(model.focusBridge.visible, false);
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
