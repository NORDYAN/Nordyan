import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { PersistedDailyFocus } from '../../repositories/daily-focus.repository';
import type { HomeWeeklyFocusData } from '../../services/weekly-focus';
import { setActiveLocale, t } from '../../i18n';

import {
  applyHomeDailyFocusGetResult,
  applyHomeDailyFocusMutationResult,
  canSwapHomeDailyFocus,
  createInitialHomeDailyFocusModel,
  startHomeDailyFocusMutation,
  toDailyFocusWeeklyFocusInput,
  toHomeDailyFocusView,
  type HomeDailyFocusModel,
} from './home-daily-focus.presentation';
import {
  formatHomeWeekCompletedCount,
  toHomeWeeklyFocusAreas,
  weeklyFocusAreaDisplayName,
} from './home-weekly-focus-copy';

const weeklyData: HomeWeeklyFocusData = {
  weekStartDate: '2026-08-24',
  focuses: [
    { area: 'sleep', mode: 'improve', needScore: 5 },
    { area: 'nutrition', mode: 'maintain', needScore: 1 },
  ],
  recoveryConstraint: false,
  engineVersion: '1.0.0',
  insufficientEvidenceFallback: false,
};

function assignment(overrides?: Partial<PersistedDailyFocus>): PersistedDailyFocus {
  return {
    id: 'df-1',
    userId: 'user-1',
    localDate: '2026-08-26',
    weekStartDate: '2026-08-24',
    actionId: 'movement_take_stairs',
    focusArea: 'everyday_movement',
    weeklyMode: 'improve',
    intensity: 'normal',
    behaviorFamily: 'stairs',
    completedAt: null,
    swapCount: 0,
    swappedFromActionId: null,
    swappedFromBehaviorFamily: null,
    swappedFromFocusArea: null,
    swappedFromIntensity: null,
    actionBankVersion: '1.0.0',
    selectorVersion: '1.0.0',
    createdAt: '2026-08-26T07:00:00.000Z',
    updatedAt: '2026-08-26T07:00:00.000Z',
    ...overrides,
  };
}

function readyModel(overrides?: Partial<HomeDailyFocusModel>): HomeDailyFocusModel {
  return {
    loadStatus: 'ready',
    assignment: assignment(),
    weekCompletedCount: 2,
    actionKnown: true,
    mutating: false,
    mutationError: false,
    ...overrides,
  };
}

describe('home daily focus presentation', () => {
  it('2. ready view resolves action title and body', () => {
    setActiveLocale('sv');
    const view = toHomeDailyFocusView(readyModel());
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.title, t('dailyFocus.action.movement_take_stairs.title'));
      assert.equal(view.body, t('dailyFocus.action.movement_take_stairs.body'));
      assert.equal(view.completed, false);
      assert.match(JSON.stringify(view), /title/);
      assert.doesNotMatch(JSON.stringify(view), /needScore/);
      assert.doesNotMatch(JSON.stringify(view), /engineVersion/);
      assert.doesNotMatch(JSON.stringify(view), /movement_take_stairs/);
    }
  });

  it('3. incomplete state offers complete and swap', () => {
    const view = toHomeDailyFocusView(readyModel());
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.canComplete, true);
      assert.equal(view.canUndo, false);
      assert.equal(view.canSwap, true);
    }
  });

  it('4–5. complete applies only after service result', () => {
    const before = readyModel();
    const started = startHomeDailyFocusMutation(before);
    assert.equal(started.assignment?.completedAt, null);
    assert.equal(started.mutating, true);
    const startedView = toHomeDailyFocusView(started);
    assert.equal(startedView.kind, 'ready');
    if (startedView.kind === 'ready') {
      assert.equal(startedView.completed, false);
    }

    const completed = applyHomeDailyFocusMutationResult(started, {
      ok: true,
      value: {
        status: 'ready',
        assignment: assignment({ completedAt: '2026-08-26T08:00:00.000Z' }),
        weekCompletedCount: 3,
        actionKnown: true,
      },
    });
    const view = toHomeDailyFocusView(completed);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.completed, true);
      assert.equal(view.canComplete, false);
      assert.equal(view.canUndo, true);
      assert.equal(view.canSwap, false);
    }
    assert.equal(completed.weekCompletedCount, 3);
  });

  it('6. undo returns incomplete and restores swap when unswapped', () => {
    const completed = readyModel({
      assignment: assignment({ completedAt: '2026-08-26T08:00:00.000Z', swapCount: 0 }),
    });
    const next = applyHomeDailyFocusMutationResult(startHomeDailyFocusMutation(completed), {
      ok: true,
      value: {
        status: 'ready',
        assignment: assignment({ completedAt: null, swapCount: 0 }),
        weekCompletedCount: 2,
        actionKnown: true,
      },
    });
    const view = toHomeDailyFocusView(next);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.completed, false);
      assert.equal(view.canSwap, true);
    }
  });

  it('7–9. swap updates rendered action and hides swap', () => {
    const before = readyModel();
    const started = startHomeDailyFocusMutation(before);
    assert.equal(started.assignment?.actionId, 'movement_take_stairs');

    const swapped = applyHomeDailyFocusMutationResult(started, {
      ok: true,
      value: {
        status: 'ready',
        assignment: assignment({
          actionId: 'movement_park_farther',
          swapCount: 1,
          swappedFromActionId: 'movement_take_stairs',
          swappedFromBehaviorFamily: 'stairs',
          swappedFromFocusArea: 'everyday_movement',
          swappedFromIntensity: 'normal',
        }),
        weekCompletedCount: 2,
        actionKnown: true,
      },
    });
    const view = toHomeDailyFocusView(swapped);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.title, t('dailyFocus.action.movement_park_farther.title'));
      assert.equal(view.canSwap, false);
    }
  });

  it('10. swap unavailable while completed', () => {
    const model = readyModel({
      assignment: assignment({ completedAt: '2026-08-26T08:00:00.000Z', swapCount: 0 }),
    });
    assert.equal(canSwapHomeDailyFocus(model), false);
    const view = toHomeDailyFocusView(model);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.canSwap, false);
    }
  });

  it('12. undo after swapped completion does not restore swap', () => {
    const next = applyHomeDailyFocusMutationResult(
      startHomeDailyFocusMutation(
        readyModel({
          assignment: assignment({ completedAt: '2026-08-26T08:00:00.000Z', swapCount: 1 }),
        }),
      ),
      {
        ok: true,
        value: {
          status: 'ready',
          assignment: assignment({ completedAt: null, swapCount: 1 }),
          weekCompletedCount: 2,
          actionKnown: true,
        },
      },
    );
    const view = toHomeDailyFocusView(next);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.completed, false);
      assert.equal(view.canSwap, false);
    }
  });

  it('13. mutation error preserves confirmed state', () => {
    const confirmed = readyModel();
    const started = startHomeDailyFocusMutation(confirmed);
    const failed = applyHomeDailyFocusMutationResult(started, {
      ok: false,
      error: { code: 'NETWORK', message: 'offline' },
    });
    assert.equal(failed.assignment?.actionId, confirmed.assignment?.actionId);
    assert.equal(failed.assignment?.completedAt, null);
    assert.equal(failed.mutationError, true);
    assert.equal(failed.mutating, false);
    const view = toHomeDailyFocusView(failed);
    assert.equal(view.kind, 'ready');
    if (view.kind === 'ready') {
      assert.equal(view.completed, false);
      assert.equal(view.mutationError, true);
    }
  });

  it('14–15. unavailable mutation keeps last assignment (no optimistic complete/swap)', () => {
    const confirmed = readyModel();
    const failed = applyHomeDailyFocusMutationResult(startHomeDailyFocusMutation(confirmed), {
      ok: true,
      value: { status: 'unavailable' },
    });
    assert.equal(failed.assignment?.actionId, 'movement_take_stairs');
    assert.equal(failed.assignment?.completedAt, null);
    assert.equal(failed.mutationError, true);
  });

  it('16–17. unknown action is fallback without mutations and does not reselect', () => {
    const model = readyModel({
      actionKnown: false,
      assignment: assignment({ actionId: 'unknown_future_action' }),
    });
    const view = toHomeDailyFocusView(model);
    assert.equal(view.kind, 'unknown');
    assert.equal(canSwapHomeDailyFocus(model), false);
    assert.doesNotMatch(JSON.stringify(view), /unknown_future_action/);
  });

  it('maps getOrCreate unavailable without wiping a later card contract', () => {
    const next = applyHomeDailyFocusGetResult(createInitialHomeDailyFocusModel(), {
      ok: true,
      value: { status: 'unavailable' },
    });
    assert.equal(toHomeDailyFocusView(next).kind, 'unavailable');
  });

  it('does not call selector from weekly mapping', () => {
    assert.deepEqual(toDailyFocusWeeklyFocusInput({ status: 'loading' }), null);
    assert.deepEqual(toDailyFocusWeeklyFocusInput({ status: 'unavailable' }), {
      status: 'unavailable',
    });
    assert.deepEqual(toDailyFocusWeeklyFocusInput({ status: 'ready', data: weeklyData }), {
      status: 'ready',
      data: weeklyData,
    });
  });
});

describe('home weekly focus copy', () => {
  it('18. renders exactly two user-facing area names', () => {
    setActiveLocale('sv');
    const areas = toHomeWeeklyFocusAreas({ status: 'ready', data: weeklyData });
    assert.equal(areas?.length, 2);
    assert.deepEqual(
      areas?.map((item) => item.name),
      ['Sömn', 'Mat'],
    );
  });

  it('19. needScore is not part of weekly display names', () => {
    const areas = toHomeWeeklyFocusAreas({ status: 'ready', data: weeklyData });
    assert.doesNotMatch(JSON.stringify(areas), /needScore/);
    assert.doesNotMatch(JSON.stringify(areas), /improve|maintain/);
    assert.equal(weeklyFocusAreaDisplayName('everyday_movement'), 'Vardagsrörelse');
  });

  it('20. weekCompletedCount has no /7 denominator', () => {
    setActiveLocale('sv');
    assert.equal(formatHomeWeekCompletedCount(0), '0 genomförda denna vecka');
    assert.equal(formatHomeWeekCompletedCount(1), '1 genomförd denna vecka');
    assert.equal(formatHomeWeekCompletedCount(2), '2 genomförda denna vecka');
    assert.doesNotMatch(formatHomeWeekCompletedCount(2), /\/7/);
  });
});

describe('home focus i18n parity', () => {
  it('31. SV/NB copy for greeting, daily, weekly, coach', () => {
    assert.equal(t('home.greeting.subtitle', undefined, 'sv'), 'Din hälsa, samlad på ett ställe.');
    assert.equal(t('home.greeting.subtitle', undefined, 'nb'), 'Helsen din, samlet på ett sted.');
    assert.equal(t('home.dailyFocus.markComplete', undefined, 'sv'), 'Markera som klart');
    assert.equal(t('home.dailyFocus.markComplete', undefined, 'nb'), 'Marker som ferdig');
    assert.equal(t('home.dailyFocus.unavailable', undefined, 'sv'), 'Dagens fokus är inte tillgängligt just nu.');
    assert.equal(
      t('home.dailyFocus.unavailable', undefined, 'nb'),
      'Dagens fokus er ikke tilgjengelig akkurat nå.',
    );
    assert.equal(t('home.coach.askCta', undefined, 'sv'), 'Fråga Coach');
    assert.equal(t('home.coach.askCta', undefined, 'nb'), 'Spør Coach');
    assert.equal(t('home.weeklyFocus.heading', undefined, 'sv'), 'Veckans fokus');
    assert.equal(t('home.weeklyFocus.heading', undefined, 'nb'), 'Ukens fokus');
    setActiveLocale('nb');
    assert.equal(formatHomeWeekCompletedCount(1), '1 gjennomført denne uken');
    assert.equal(formatHomeWeekCompletedCount(2), '2 gjennomførte denne uken');
    assert.equal(weeklyFocusAreaDisplayName('everyday_movement'), 'Hverdagsbevegelse');
    setActiveLocale('sv');
  });
});
