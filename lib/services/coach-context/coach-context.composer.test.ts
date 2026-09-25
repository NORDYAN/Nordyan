import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import type { Result } from '../../core';
import type { InitialLifestyleCheck } from '../../domain/initial-lifestyle';
import { setActiveLocale } from '../../i18n';
import type { UserProfile } from '../../domain/profile';
import type { HealthSnapshot } from '../../domain/snapshot';
import type { WeeklyCheckIn } from '../../domain/weekly-check-in';
import type { CoachHomeSummary } from '../coach-home';
import type { DevelopmentHomeSummary } from '../development';
import type { WeeklyCheckInCurrentWeek } from '../weekly-check-in';

import { mapInitialLifestyleForCoachAsk } from './coach-ask-initial-lifestyle.mapper';
import { mapWeeklyCheckInForCoachAsk } from './coach-ask-weekly-check-in.mapper';
import { mapHealthScoreActivityComponentToLevel } from '../../../shared/coach-language';

import {
  buildCoachAskRequestFromSummaries,
  composeCoachAskRequest,
  toCoachAskChangeDirection,
  type ComposeCoachAskRequestDeps,
} from './coach-context.composer';

const readyCoachHome: Extract<CoachHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  focus: {
    type: 'reduce_waist',
    title: 'Minska midjemåttet',
    subtitle: 'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
  },
  plan: {
    available: true,
    recommendationId: 'waist_walk_after_dinner_v1',
    title: 'Promenad efter middagen',
    description: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
    durationMinutes: 30,
    frequencyPerWeek: 4,
  },
};

const comparableDevelopment: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  latestSnapshotId: 'snap-secret',
  latestCapturedAt: '2026-08-11T10:00:00.000Z',
  currentScore: 74,
  scoreChange: { status: 'ready', current: 74, previous: 68, change: 6 },
  trend: 'improving',
  weight: { status: 'ready', current: 80, previous: 82, change: -2 },
  waist: { status: 'ready', current: 90, previous: 92, change: -2 },
  activity: { status: 'ready', current: 58, previous: 50, change: 8 },
  sleep: { status: 'limitation', message: 'Ingen data' },
  coach: {
    available: true,
    title: 'Promenad efter middagen',
    message: 'Promenera 30 minuter',
    recommendationId: 'waist_walk_after_dinner_v1',
  },
};

describe('mapHealthScoreActivityComponentToLevel', () => {
  it('maps frozen activity_score bands only', () => {
    assert.equal(mapHealthScoreActivityComponentToLevel(50), 'light');
    assert.equal(mapHealthScoreActivityComponentToLevel(68), 'moderate');
    assert.equal(mapHealthScoreActivityComponentToLevel(58), null);
    assert.equal(mapHealthScoreActivityComponentToLevel(null), null);
  });
});

describe('toCoachAskChangeDirection', () => {
  afterEach(() => {
    setActiveLocale('sv');
  });

  it('maps signed changes', () => {
    assert.equal(toCoachAskChangeDirection(2), 'up');
    assert.equal(toCoachAskChangeDirection(-1), 'down');
    assert.equal(toCoachAskChangeDirection(0), 'stable');
  });
});

describe('buildCoachAskRequestFromSummaries', () => {
  afterEach(() => {
    setActiveLocale('sv');
  });

  it('composes v1.7 context from Development + Coach Home without forbidden fields', () => {
    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Hur går det för mig?',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    const { request } = result;
    assert.equal(request.version, 'coach-ask-v1.7');
    assert.equal(request.locale, 'sv-SE');
    assert.equal(request.context.focus.type, 'reduce_waist');
    assert.equal(request.context.plan.recommendationId, 'waist_walk_after_dinner_v1');
    assert.equal(request.context.plan.title, 'Promenad efter maten');
    assert.equal(request.context.plan.durationMinutes, null);
    assert.equal(request.context.plan.frequencyPerWeek, null);
    assert.equal(request.context.plan.description.includes('30 minuter'), false);
    assert.equal(request.context.plan.description.includes('fyra dagar'), false);
    assert.equal(request.context.weeklyCheckIn, null);
    assert.equal(request.context.initialLifestyle, null);
    assert.equal(request.context.ageBand, null);
    assert.equal(request.context.sex, null);

    assert.ok(request.context.healthState);
    assert.equal(request.context.healthState.overallScore, 74);
    assert.equal(request.context.healthState.scoreBandLabel, 'Bra hälsonivå');
    assert.deepEqual(request.context.healthState.scoreChange, {
      status: 'ready',
      kind: 'health_score_overall',
      change: 6,
      direction: 'up',
    });
    assert.deepEqual(request.context.healthState.weight, {
      status: 'ready',
      currentKg: 80,
      changeKg: -2,
      direction: 'down',
    });
    assert.deepEqual(request.context.healthState.waist, {
      status: 'ready',
      currentCm: 90,
      changeCm: -2,
      direction: 'down',
    });
    assert.deepEqual(request.context.healthState.healthScoreActivity, {
      status: 'ready',
      kind: 'health_score_activity_component',
      current: 58,
      change: 8,
      direction: 'up',
      currentActivityLevel: null,
      previousActivityLevel: 'light',
    });
    assert.deepEqual(request.context.healthState.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.deepEqual(request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });

    assert.deepEqual(request.context.development, {
      trend: 'improving',
      historyStatus: 'comparable',
    });

    assert.deepEqual(request.context.availability, {
      healthScoreAvailable: true,
      measurementHistoryComparable: true,
      sleepDataAvailable: false,
      deviceActivityAvailable: false,
      integratedHealthAvailable: false,
      stepsDataAvailable: false,
    });

    const serialized = JSON.stringify(request);
    assert.equal(serialized.includes('snap-secret'), false);
    assert.equal(serialized.includes('"latestCapturedAt"'), false);
    assert.equal(serialized.includes('"bmiScore"'), false);
    assert.equal(serialized.includes('"neckCm"'), false);
    assert.equal(serialized.includes('"neck"'), false);
    assert.equal(serialized.includes('"heightCm"'), false);
    assert.equal(serialized.includes('"hipCm"'), false);
    assert.equal(serialized.includes('"bodyFatPct"'), false);
    assert.equal(serialized.includes('"bodyFatScore"'), false);
    assert.equal(serialized.includes('"bodyFatCategory"'), false);
    assert.equal(serialized.includes('dateOfBirth'), false);
    assert.equal(serialized.includes('ageYears'), false);
    assert.equal(serialized.includes('"measurementHistory"'), false);
    assert.equal(serialized.includes('"series"'), false);
    assert.equal(serialized.includes('"weekStartDate"'), false);
    assert.equal(serialized.includes('"userId"'), false);
    assert.equal(serialized.includes('"createdAt"'), false);
    assert.equal(serialized.includes('"lessHealthyFoodFrequency"'), false);
  });

  it('maps app locale sv to Ask locale sv-SE and nb to nb-NO', () => {
    setActiveLocale('sv');
    const swedish = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Varför är detta mitt fokus?',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });
    assert.equal(swedish.status, 'ready');
    if (swedish.status === 'ready') {
      assert.equal(swedish.request.version, 'coach-ask-v1.7');
      assert.equal(swedish.request.locale, 'sv-SE');
      assert.equal(swedish.request.context.healthState?.scoreBandLabel, 'Bra hälsonivå');
    }

    setActiveLocale('nb');
    const norwegian = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Hvorfor er dette fokuset mitt?',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });
    assert.equal(norwegian.status, 'ready');
    if (norwegian.status === 'ready') {
      assert.equal(norwegian.request.version, 'coach-ask-v1.7');
      assert.equal(norwegian.request.locale, 'nb-NO');
      assert.equal(norwegian.request.context.focus.type, 'reduce_waist');
      assert.equal(
        norwegian.request.context.plan.recommendationId,
        'waist_walk_after_dinner_v1',
      );
      assert.equal(norwegian.request.context.healthState?.scoreBandLabel, 'Godt helsenivå');
      assert.notEqual(
        norwegian.request.context.healthState?.scoreBandLabel,
        'Bra hälsonivå',
      );
    }

    const explicit = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Hvordan ligger fettprosenten min an sammenlignet med andre på min alder?',
      generatedAt: '2026-08-12T12:00:00.000Z',
      locale: 'nb',
    });
    assert.equal(explicit.status, 'ready');
    if (explicit.status === 'ready') {
      assert.equal(explicit.request.locale, 'nb-NO');
      assert.deepEqual(explicit.request.context.bodyFatReference, {
        status: 'unavailable',
        unavailableReason: 'missing_body_fat_percent',
      });
    }
  });

  it('localizes v1.6 Focus and Plan presentation for nb without changing semantics', () => {
    const swedishSummary: Extract<CoachHomeSummary, { status: 'ready' }> = {
      status: 'ready',
      focus: {
        type: 'improve_weight_balance',
        title: 'Hitta en bättre viktbalans',
        subtitle: 'Svensk fokuspresentation.',
      },
      plan: {
        available: true,
        recommendationId: 'weight_balance_gentle_nutrition_v1',
        title: 'Skapa balanserade måltider',
        description:
          'Prioritera regelbundna, näringsrika måltider den här veckan utan att stressa kroppen.',
        durationMinutes: 20,
        frequencyPerWeek: 3,
      },
    };

    const norwegian = buildCoachAskRequestFromSummaries({
      coachHome: swedishSummary,
      development: comparableDevelopment,
      question: 'Hvorfor er dette fokuset mitt?',
      locale: 'nb',
    });

    assert.equal(norwegian.status, 'ready');
    if (norwegian.status === 'ready') {
      assert.equal(norwegian.request.locale, 'nb-NO');
      assert.equal(norwegian.request.context.focus.type, 'improve_weight_balance');
      assert.equal(norwegian.request.context.focus.title, 'Finn en bedre vektbalanse');
      assert.notEqual(
        norwegian.request.context.focus.title,
        'Hitta en bättre viktbalans',
      );
      assert.equal(
        norwegian.request.context.plan.recommendationId,
        'weight_balance_gentle_nutrition_v1',
      );
      assert.equal(norwegian.request.context.plan.title, 'Lag balanserte måltider');
      assert.equal(
        norwegian.request.context.plan.description,
        'Prioriter jevnlige, næringsrike måltider denne uken uten å stresse kroppen.',
      );
      assert.doesNotMatch(
        JSON.stringify(norwegian.request.context),
        /Hitta en bättre viktbalans|Skapa balanserade måltider/,
      );
    }

    const swedish = buildCoachAskRequestFromSummaries({
      coachHome: swedishSummary,
      development: comparableDevelopment,
      question: 'Varför är detta mitt fokus?',
      locale: 'sv',
    });

    assert.equal(swedish.status, 'ready');
    if (swedish.status === 'ready') {
      assert.equal(swedish.request.locale, 'sv-SE');
      assert.equal(swedish.request.context.focus.title, 'Hitta en bättre viktbalans');
      assert.equal(swedish.request.context.plan.title, 'Skapa balanserade måltider');
    }
  });

  it('preserves insufficient history without inventing changes', () => {
    const development: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
      ...comparableDevelopment,
      scoreChange: { status: 'insufficient_history', current: 74 },
      trend: 'insufficient_history',
      weight: { status: 'insufficient_history', current: 80 },
      waist: { status: 'insufficient_history', current: 90 },
      activity: { status: 'insufficient_history', current: 58 },
    };

    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development,
      question: 'Vad har förbättrats?',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.deepEqual(result.request.context.healthState?.scoreChange, {
      status: 'insufficient_history',
      kind: 'health_score_overall',
    });
    assert.deepEqual(result.request.context.healthState?.healthScoreActivity, {
      status: 'insufficient_history',
      kind: 'health_score_activity_component',
      current: 58,
      currentActivityLevel: null,
    });
    assert.equal(
      'change' in (result.request.context.healthState?.healthScoreActivity ?? {}),
      false,
    );
    assert.deepEqual(result.request.context.healthState?.weight, {
      status: 'insufficient_history',
      currentKg: 80,
    });
    assert.deepEqual(result.request.context.development, {
      trend: 'insufficient_history',
      historyStatus: 'insufficient_history',
    });
    assert.equal(result.request.context.availability.measurementHistoryComparable, false);
  });

  it('labels 50 → 68 / +18 as a Health Score activity component, not +18 activity', () => {
    const development: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
      ...comparableDevelopment,
      activity: { status: 'ready', current: 68, previous: 50, change: 18 },
    };

    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development,
      question: 'Har min aktivitet ökat?',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.deepEqual(result.request.context.healthState?.healthScoreActivity, {
      status: 'ready',
      kind: 'health_score_activity_component',
      current: 68,
      change: 18,
      direction: 'up',
      currentActivityLevel: 'moderate',
      previousActivityLevel: 'light',
    });
    assert.deepEqual(result.request.context.healthState?.weight, {
      status: 'ready',
      currentKg: 80,
      changeKg: -2,
      direction: 'down',
    });
    assert.deepEqual(result.request.context.healthState?.waist, {
      status: 'ready',
      currentCm: 90,
      changeCm: -2,
      direction: 'down',
    });
    const serialized = JSON.stringify(result.request.context.healthState?.healthScoreActivity);
    assert.equal(serialized.includes('"steps"'), false);
    assert.equal(serialized.includes('kind":"health_score_activity_component"'), true);
  });

  it('does not expose a numeric personalized dose for a GENERAL recommendation', () => {
    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Vad ska jag göra den här veckan?',
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.equal(readyCoachHome.plan.durationMinutes, 30);
    assert.equal(readyCoachHome.plan.frequencyPerWeek, 4);
    assert.equal(result.request.context.plan.durationMinutes, null);
    assert.equal(result.request.context.plan.frequencyPerWeek, null);
    assert.equal(result.request.context.plan.description.includes('30'), false);
    assert.doesNotMatch(JSON.stringify(result.request.context.plan), /"durationMinutes":30/);
  });

  it('exposes engine dose only when SPECIFIC presentation is unlocked', () => {
    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Vad ska jag göra den här veckan?',
      presentationSignals: { activityVolumeMeasured: true },
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }

    assert.equal(result.request.context.plan.durationMinutes, 30);
    assert.equal(result.request.context.plan.frequencyPerWeek, 4);
    assert.match(result.request.context.plan.description, /30 minuter/);
  });

  it('does not unlock Ask dose from BMI or self-reported activity, or from always-GENERAL families', () => {
    const falseSignal = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: comparableDevelopment,
      question: 'Vad ska jag göra?',
      presentationSignals: { activityVolumeMeasured: false },
    });
    assert.equal(falseSignal.status, 'ready');
    if (falseSignal.status === 'ready') {
      assert.equal(falseSignal.request.context.plan.durationMinutes, null);
      assert.equal(falseSignal.request.context.plan.frequencyPerWeek, null);
    }

    const alwaysGeneral: Extract<CoachHomeSummary, { status: 'ready' }> = {
      ...readyCoachHome,
      plan: {
        ...readyCoachHome.plan,
        recommendationId: 'weight_balance_gentle_nutrition_v1',
        durationMinutes: 20,
        frequencyPerWeek: 3,
      },
    };
    const result = buildCoachAskRequestFromSummaries({
      coachHome: alwaysGeneral,
      development: comparableDevelopment,
      question: 'Vad ska jag äta?',
      presentationSignals: { activityVolumeMeasured: true },
    });
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.request.context.plan.durationMinutes, null);
    assert.equal(result.request.context.plan.frequencyPerWeek, null);
  });

  it('omits healthState when development is empty but plan exists', () => {
    const result = buildCoachAskRequestFromSummaries({
      coachHome: readyCoachHome,
      development: { status: 'empty' },
      question: 'Ge mig ett alternativ',
      generatedAt: '2026-08-12T12:00:00.000Z',
    });

    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.request.context.healthState, undefined);
    assert.equal(result.request.context.development, undefined);
    assert.deepEqual(result.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
    assert.equal(result.request.context.availability.healthScoreAvailable, false);
    assert.equal(result.request.context.weeklyCheckIn, null);
    assert.equal(result.request.context.initialLifestyle, null);
    assert.equal(result.request.context.ageBand, null);
    assert.equal(result.request.context.sex, null);
  });

  it('returns unavailable when plan is missing', () => {
    const coachHome: CoachHomeSummary = {
      status: 'ready',
      focus: readyCoachHome.focus,
      plan: { available: false, recommendationId: null },
    };
    const result = buildCoachAskRequestFromSummaries({
      coachHome,
      development: comparableDevelopment,
      question: 'Varför är detta mitt fokus?',
    });
    assert.deepEqual(result, { status: 'unavailable', reason: 'no_plan' });
  });
});

const currentWeekCheckIn: WeeklyCheckIn = {
  id: 'check-in-secret',
  userId: 'user-secret',
  weekStartDate: '2026-08-10',
  sleepQuality: 2,
  energy: 2,
  stress: 5,
  trainingFrequency: 'none',
  everydayActivity: 2,
  eatingQuality: 3,
  alcoholConsumption: '1_3',
  planAdherence: 2,
  createdAt: '2026-08-13T07:00:00.000Z',
  updatedAt: '2026-08-13T07:00:00.000Z',
};

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

const baselineCheckIn: InitialLifestyleCheck = {
  id: 'lifestyle-secret',
  userId: 'user-secret',
  sleepQuality: 4,
  energy: 3,
  stress: 2,
  lessHealthyFoodFrequency: 'daily',
  everydayActivity: 3,
  eatingQuality: 3,
  alcoholConsumption: '15_plus',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:00:00.000Z',
};

function composeDeps(
  overrides: Partial<ComposeCoachAskRequestDeps> = {},
): ComposeCoachAskRequestDeps {
  return {
    getCoachHomeSummary: async () => ok(readyCoachHome),
    getDevelopmentHomeSummary: async () => ok(comparableDevelopment),
    getCurrentWeekWeeklyCheckIn: async () =>
      ok({ status: 'empty', weekStartDate: '2026-08-10' } satisfies WeeklyCheckInCurrentWeek),
    getInitialLifestyle: async () => ok(null),
    getLatestSnapshot: async () => ok(null),
    getProfile: async () => ok(null),
    ...overrides,
  };
}

describe('composeCoachAskRequest current GENERAL path', () => {
  it('does not send engine minutes or frequency without presentation signals', async () => {
    const result = await composeCoachAskRequest('user-1', 'Vad ska jag göra?', composeDeps());
    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.version, 'coach-ask-v1.7');
    assert.equal(result.value.request.context.plan.durationMinutes, null);
    assert.equal(result.value.request.context.plan.frequencyPerWeek, null);
  });
});

describe('composeCoachAskRequest v1.3 weekly check-in', () => {
  it('maps a ready current-week check-in including stress polarity', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur har min vecka varit?',
      composeDeps({
        getCurrentWeekWeeklyCheckIn: async () =>
          ok({
            status: 'ready',
            weekStartDate: '2026-08-10',
            checkIn: currentWeekCheckIn,
          }),
      }),
      'nb',
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.equal(result.value.request.version, 'coach-ask-v1.7');
    assert.equal(result.value.request.locale, 'nb-NO');
    assert.equal(result.value.request.context.initialLifestyle, null);
    assert.deepEqual(result.value.request.context.weeklyCheckIn, {
      source: 'current_week_self_report',
      sleepQuality: { value: 2, polarity: 'higher_better', meaning: 'poor' },
      energy: { value: 2, polarity: 'higher_better', meaning: 'low' },
      stress: { value: 5, polarity: 'higher_worse', meaning: 'very_high' },
      trainingFrequency: {
        value: 'none',
        meaning: 'no_sessions',
        kind: 'self_reported_session_count',
      },
      everydayActivity: { value: 2, polarity: 'higher_better', meaning: 'low' },
      eatingQuality: { value: 3, polarity: 'higher_better', meaning: 'okay' },
      alcoholConsumption: {
        value: '1_3',
        meaning: 'one_to_three_drinks',
        kind: 'neutral_self_reported_bucket',
      },
      planAdherence: { value: 2, polarity: 'higher_better', meaning: 'poor' },
    });

    const serialized = JSON.stringify(result.value.request);
    assert.equal(serialized.includes('check-in-secret'), false);
    assert.equal(serialized.includes('user-secret'), false);
    assert.equal(serialized.includes('2026-08-10'), false);
    assert.equal(serialized.includes('"weekStartDate"'), false);
    assert.equal(serialized.includes('"createdAt"'), false);
    assert.equal(serialized.includes('"updatedAt"'), false);
    assert.equal(serialized.includes('sleep_quality'), false);
    assert.equal(serialized.includes('lessHealthyFoodFrequency'), false);
  });

  it('sets weeklyCheckIn null when the current week is empty', async () => {
    const result = await composeCoachAskRequest('user-1', 'Vad ska jag göra?', composeDeps());

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.weeklyCheckIn, null);
    assert.equal(result.value.request.context.initialLifestyle, null);
    assert.equal(result.value.request.context.healthState?.overallScore, 74);
  });

  it('keeps Coach Ask ready when Weekly Check-in retrieval fails', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Varför är detta mitt fokus?',
      composeDeps({
        getCurrentWeekWeeklyCheckIn: async () => ({
          ok: false,
          error: { code: 'INTEGRATION', message: 'Kunde inte hämta veckokollen.' },
        }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.weeklyCheckIn, null);
    assert.equal(result.value.request.context.focus.type, 'reduce_waist');
  });

  it('keeps Coach Ask ready when Weekly Check-in fetch throws', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur anpassar jag planen?',
      composeDeps({
        getCurrentWeekWeeklyCheckIn: async () => {
          throw new Error('network down');
        },
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.weeklyCheckIn, null);
  });

  it('calls getCurrentWeek once with only userId and never a previous week', async () => {
    const calls: unknown[][] = [];
    await composeCoachAskRequest(
      'user-1',
      'Hur har veckan varit?',
      composeDeps({
        getCurrentWeekWeeklyCheckIn: async (...args: unknown[]) => {
          calls.push(args);
          return ok({ status: 'empty', weekStartDate: '2026-08-10' });
        },
      }),
    );

    assert.deepEqual(calls, [['user-1']]);
  });
});

describe('composeCoachAskRequest v1.3 initial lifestyle', () => {
  it('maps a complete baseline independently of Weekly Check-in', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur sover jag vanligtvis?',
      composeDeps({
        getInitialLifestyle: async () => ok(baselineCheckIn),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.equal(result.value.request.version, 'coach-ask-v1.7');
    assert.equal(result.value.request.context.weeklyCheckIn, null);
    assert.deepEqual(
      result.value.request.context.initialLifestyle,
      mapInitialLifestyleForCoachAsk(baselineCheckIn),
    );

    const serialized = JSON.stringify(result.value.request);
    assert.equal(serialized.includes('lifestyle-secret'), false);
    assert.equal(serialized.includes('user-secret'), false);
    assert.equal(serialized.includes('"createdAt"'), false);
    assert.equal(serialized.includes('"updatedAt"'), false);
    assert.equal(serialized.includes('sleep_quality'), false);
    assert.equal(serialized.includes('less_healthy_food_frequency'), false);
    assert.equal(serialized.includes('trainingFrequency'), false);
    assert.equal(serialized.includes('planAdherence'), false);
  });

  it('sets initialLifestyle null when no row exists', async () => {
    const result = await composeCoachAskRequest('user-1', 'Hur sover jag?', composeDeps());
    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.initialLifestyle, null);
    assert.equal(result.value.request.context.weeklyCheckIn, null);
    assert.equal(result.value.request.context.focus.type, 'reduce_waist');
  });

  it('keeps Coach Ask ready when Initial Lifestyle retrieval fails', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur sover jag?',
      composeDeps({
        getInitialLifestyle: async () => ({
          ok: false,
          error: { code: 'INTEGRATION', message: 'Kunde inte hämta livsstilskollen.' },
        }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.initialLifestyle, null);
    assert.equal(result.value.request.context.healthState?.overallScore, 74);
  });

  it('keeps Coach Ask ready when Initial Lifestyle fetch throws', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur sover jag?',
      composeDeps({
        getInitialLifestyle: async () => {
          throw new Error('network down');
        },
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.initialLifestyle, null);
  });

  it('preserves legacy null nutrition on an otherwise valid baseline', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur äter jag?',
      composeDeps({
        getInitialLifestyle: async () =>
          ok({ ...baselineCheckIn, lessHealthyFoodFrequency: null }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    const lifestyle = result.value.request.context.initialLifestyle;
    assert.ok(lifestyle);
    assert.equal(lifestyle.lessHealthyFoodFrequency, null);
    assert.equal(lifestyle.alcoholConsumption.value, '15_plus');
    assert.equal(lifestyle.sleepQuality.value, 4);
  });

  it('fails closed to null when required baseline fields are unreadable', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Hur sover jag?',
      composeDeps({
        getInitialLifestyle: async () =>
          ok({
            ...baselineCheckIn,
            alcoholConsumption: '15' as InitialLifestyleCheck['alcoholConsumption'],
          }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }
    assert.equal(result.value.request.context.initialLifestyle, null);
  });

  it('keeps conflicting baseline and current-week alcohol distinguishable', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Dricker jag för mycket?',
      composeDeps({
        getCurrentWeekWeeklyCheckIn: async () =>
          ok({
            status: 'ready',
            weekStartDate: '2026-08-10',
            checkIn: currentWeekCheckIn,
          }),
        getInitialLifestyle: async () => ok(baselineCheckIn),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    const { weeklyCheckIn, initialLifestyle } = result.value.request.context;
    assert.equal(weeklyCheckIn?.source, 'current_week_self_report');
    assert.equal(weeklyCheckIn?.alcoholConsumption.value, '1_3');
    assert.equal(initialLifestyle?.source, 'onboarding_baseline_self_report');
    assert.equal(initialLifestyle?.alcoholConsumption.value, '15_plus');
    assert.notEqual(
      weeklyCheckIn?.alcoholConsumption.value,
      initialLifestyle?.alcoholConsumption.value,
    );
  });

  it('exposes baseline 15_plus for Dricker jag för mycket? when Weekly Check-in is absent', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Dricker jag för mycket?',
      composeDeps({
        getInitialLifestyle: async () => ok(baselineCheckIn),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.equal(result.value.request.context.weeklyCheckIn, null);
    assert.equal(result.value.request.question, 'Dricker jag för mycket?');
    assert.deepEqual(result.value.request.context.initialLifestyle?.alcoholConsumption, {
      value: '15_plus',
      meaning: 'fifteen_or_more_drinks',
      kind: 'neutral_self_reported_bucket',
    });
  });
});

const snapshotWithBodyFat: HealthSnapshot = {
  id: 'snap-secret',
  userId: 'user-secret',
  createdAt: '2026-08-11T10:00:00.000Z',
  overallScore: 74,
  bmiScore: 70,
  whtrScore: 68,
  bodyFatScore: 65,
  activityScore: 58,
  primaryFocus: 'reduce_waist',
  coachRecommendationId: 'waist_walk_after_dinner_v1',
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  engineVersion: 'v1',
  snapshotReason: 'measurement',
  bodyFatPct: 20.1,
  coachDurationMinutes: 30,
  coachFrequencyPerWeek: 4,
};

const profileWithDemographics: UserProfile = {
  id: 'profile-secret',
  userId: 'user-secret',
  firstName: 'Test',
  dateOfBirth: '1982-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-08-01T09:00:00.000Z',
  updatedAt: '2026-08-01T09:00:00.000Z',
};

function assertNoSensitiveBodyCompositionLeak(serialized: string): void {
  assert.equal(serialized.includes('dateOfBirth'), false);
  assert.equal(serialized.includes('1982-01-01'), false);
  assert.equal(serialized.includes('ageYears'), false);
  assert.equal(serialized.includes('exactAge'), false);
  assert.equal(serialized.includes('"neckCm"'), false);
  assert.equal(serialized.includes('"heightCm"'), false);
  assert.equal(serialized.includes('"hipCm"'), false);
  assert.equal(serialized.includes('"bodyFatScore"'), false);
  assert.equal(serialized.includes('"bodyFatCategory"'), false);
  assert.equal(serialized.includes('"bodyFatPct"'), false);
  assert.equal(serialized.includes('BODY_FAT_REFERENCE_MIDPOINTS'), false);
  assert.equal(serialized.includes('acsmTable'), false);
  assert.equal(serialized.includes('ACSM_BODY_FAT_PERCENTILE_TABLE'), false);
  assert.equal(serialized.includes('"percentile"'), false);
  assert.equal(serialized.includes('snap-secret'), false);
  assert.equal(serialized.includes('profile-secret'), false);
  assert.equal(serialized.includes('user-secret'), false);
  assert.equal(serialized.includes('"firstName"'), false);
}

describe('composeCoachAskRequest v1.5 body fat reference', () => {
  it('maps snapshot bodyFatPct to bodyFatPercent and derives ageBand without DOB', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Vad är min fettprocent?',
      composeDeps({
        getLatestSnapshot: async () => ok(snapshotWithBodyFat),
        getProfile: async () => ok(profileWithDemographics),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    const { request } = result.value;
    assert.equal(request.version, 'coach-ask-v1.7');
    assert.equal(request.question, 'Vad är min fettprocent?');
    assert.deepEqual(request.context.healthState?.bodyComposition, {
      status: 'ready',
      bodyFatPercent: 20.1,
      estimationKind: 'calculated_from_latest_snapshot',
    });
    assert.equal(request.context.ageBand, '40_49');
    assert.equal(request.context.sex, 'male');
    assert.deepEqual(request.context.bodyFatReference, {
      status: 'ready',
      source: 'acsm_getp_10_11_cooper_institute',
      sex: 'male',
      referenceAgeGroup: '40_49',
      bodyFatPercent: 20.1,
      referenceMedianPercent: 21.9,
      comparisonToReferenceMedian: 'below',
      referencePositionBand: 'below_median',
    });
    assertNoSensitiveBodyCompositionLeak(JSON.stringify(request));
  });

  it('maps null snapshot bodyFatPct to unavailable without describing other facts as missing', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Vad är min fettprocent?',
      composeDeps({
        getLatestSnapshot: async () => ok({ ...snapshotWithBodyFat, bodyFatPct: null }),
        getProfile: async () => ok(profileWithDemographics),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.deepEqual(result.value.request.context.healthState?.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.equal(result.value.request.context.ageBand, '40_49');
    assert.equal(result.value.request.context.healthState?.weight.currentKg, 80);
    assert.deepEqual(result.value.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
  });

  it('fails closed when profile provenance is unavailable', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Är min fettprocent bra för min ålder?',
      composeDeps({
        getLatestSnapshot: async () => ok(snapshotWithBodyFat),
        getProfile: async () => ok(null),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.deepEqual(result.value.request.context.healthState?.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.equal(result.value.request.context.ageBand, null);
    assert.equal(result.value.request.context.sex, null);
    assert.deepEqual(result.value.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
  });

  it('keeps Coach Ask ready when snapshot or profile retrieval fails', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Vad väger jag?',
      composeDeps({
        getLatestSnapshot: async () => ({
          ok: false,
          error: { code: 'INTEGRATION', message: 'Kunde inte hämta snapshot.' },
        }),
        getProfile: async () => {
          throw new Error('profile failed');
        },
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.equal(result.value.request.context.healthState?.weight.currentKg, 80);
    assert.deepEqual(result.value.request.context.healthState?.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.equal(result.value.request.context.ageBand, null);
    assert.equal(result.value.request.context.sex, null);
    assert.deepEqual(result.value.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
  });

  it('maps other sex and does not dump Initial Lifestyle for a weight question payload shape', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Vad väger jag?',
      composeDeps({
        getLatestSnapshot: async () => ok(snapshotWithBodyFat),
        getProfile: async () => ok({ ...profileWithDemographics, gender: 'other' }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.equal(result.value.request.context.sex, 'other');
    assert.equal(result.value.request.context.initialLifestyle, null);
    assert.equal(result.value.request.context.healthState?.weight.currentKg, 80);
    assert.deepEqual(result.value.request.context.healthState?.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.deepEqual(result.value.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
  });

  it('does not send fallback body fat to Coach after body measurements were skipped', async () => {
    const result = await composeCoachAskRequest(
      'user-1',
      'Vad är min fettprocent?',
      composeDeps({
        getLatestSnapshot: async () =>
          ok({ ...snapshotWithBodyFat, snapshotReason: 'onboarding' }),
        getProfile: async () =>
          ok({ ...profileWithDemographics, waistCm: null, neckCm: null }),
      }),
    );

    assert.equal(result.ok, true);
    if (!result.ok || result.value.status !== 'ready') {
      return;
    }

    assert.deepEqual(result.value.request.context.healthState?.bodyComposition, {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
    assert.deepEqual(result.value.request.context.bodyFatReference, {
      status: 'unavailable',
      unavailableReason: 'missing_body_fat_percent',
    });
  });
});

describe('Coach Context engine isolation', () => {
  it('does not add deterministic engine dependencies', () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const composerSource = [
      readFileSync(path.join(dir, 'coach-context.composer.ts'), 'utf8'),
      readFileSync(path.join(dir, 'coach-ask-weekly-check-in.mapper.ts'), 'utf8'),
      readFileSync(path.join(dir, 'coach-ask-initial-lifestyle.mapper.ts'), 'utf8'),
      readFileSync(path.join(dir, 'coach-ask-body-composition.mapper.ts'), 'utf8'),
      readFileSync(path.join(dir, 'coach-ask-body-fat-reference.mapper.ts'), 'utf8'),
    ].join('\n');
    const serviceSource = readFileSync(path.join(dir, 'coach-context.service.ts'), 'utf8');
    const source = `${composerSource}\n${serviceSource}`;

    assert.equal(source.includes('health-score-engine'), false);
    assert.equal(source.includes('focus-engine'), false);
    assert.equal(source.includes('coach-engine'), false);
    assert.equal(composerSource.includes('resolveCoachRecommendationPresentationTier'), true);
    assert.equal(composerSource.includes('snapshot.service'), false);
    assert.equal(source.includes('createSnapshot'), false);
    assert.equal(source.includes('BODY_FAT_REFERENCE_MIDPOINTS'), false);
    assert.equal(source.includes('classifyBodyFat'), false);
    assert.equal(source.includes('initialLifestyleAnswersValidator'), false);
    assert.equal(source.includes('initialLifestyleService.save'), false);
  });
});

describe('mapWeeklyCheckInForCoachAsk', () => {
  it('projects all eight fields and never forwards domain metadata', () => {
    const mapped = mapWeeklyCheckInForCoachAsk(currentWeekCheckIn);
    assert.ok(mapped);
    assert.equal(mapped.source, 'current_week_self_report');
    assert.deepEqual(
      Object.keys(mapped).sort(),
      [
        'alcoholConsumption',
        'eatingQuality',
        'energy',
        'everydayActivity',
        'planAdherence',
        'sleepQuality',
        'source',
        'stress',
        'trainingFrequency',
      ].sort(),
    );
    assert.equal('id' in mapped, false);
    assert.equal('userId' in mapped, false);
    assert.equal('weekStartDate' in mapped, false);
    assert.equal('createdAt' in mapped, false);
    assert.equal('updatedAt' in mapped, false);
  });

  it('encodes stress 5 as higher_worse very_high', () => {
    const mapped = mapWeeklyCheckInForCoachAsk({
      ...currentWeekCheckIn,
      stress: 5,
    });
    assert.deepEqual(mapped?.stress, {
      value: 5,
      polarity: 'higher_worse',
      meaning: 'very_high',
    });
    assert.notEqual(mapped?.stress.polarity, 'higher_better');
    assert.notEqual(mapped?.stress.meaning, 'very_good');
  });
});

