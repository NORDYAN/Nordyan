import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DevelopmentHomeSummary } from '../../services/development';

import {
  getHealthScoreExplainedEmptyMessage,
  HEALTH_SCORE_EXPLAINED_LEARN_MORE_DESTINATION,
  buildHealthScoreExplainedViewModel,
  mapHealthScoreExplainedSummaryToFetchState,
} from './health-score-explained.presentation';
import { t } from '../../i18n';

const comparableHome: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  latestSnapshotId: 's2',
  latestCapturedAt: '2026-08-08T10:00:00.000Z',
  currentScore: 74,
  scoreChange: {
    status: 'ready',
    current: 74,
    previous: 72,
    change: 2,
  },
  trend: 'improving',
  weight: {
    status: 'ready',
    current: 80,
    previous: 82,
    change: -2,
  },
  waist: {
    status: 'ready',
    current: 90,
    previous: 92,
    change: -2,
  },
  activity: {
    status: 'ready',
    current: 58,
    previous: 50,
    change: 8,
  },
  sleep: { status: 'limitation', message: 'Ingen data' },
  coach: {
    available: true,
    title: 'Promenad efter middagen',
    message: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
    recommendationId: 'waist_walk_after_dinner_v1',
  },
};

const singleSnapshotHome: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  latestSnapshotId: 's1',
  latestCapturedAt: '2026-08-08T10:00:00.000Z',
  currentScore: 70,
  scoreChange: {
    status: 'insufficient_history',
    current: 70,
  },
  trend: 'insufficient_history',
  weight: {
    status: 'insufficient_history',
    current: 80,
  },
  waist: {
    status: 'insufficient_history',
    current: 90,
  },
  activity: {
    status: 'insufficient_history',
    current: 50,
  },
  sleep: { status: 'limitation', message: 'Ingen data' },
  coach: {
    available: false,
    title: null,
    message: null,
    recommendationId: null,
  },
};

describe('buildHealthScoreExplainedViewModel', () => {
  it('maps comparable history with fixed factor order and latest-vs-previous score change', () => {
    const model = buildHealthScoreExplainedViewModel(comparableHome);

    assert.equal(model.currentScore, 74);
    assert.equal(model.scoreBandLabel, 'Bra hälsonivå');
    assert.equal(model.historyStatus, 'comparable');
    assert.deepEqual(model.scoreChange, {
      status: 'ready',
      direction: 'up',
      text: '↑ +2 sedan senaste uppdateringen',
    });

    assert.deepEqual(
      model.factors.map((factor) => factor.id),
      ['waist', 'activity', 'sleep', 'weight'],
    );
    assert.deepEqual(
      model.factors.map((factor) => factor.label),
      ['Midjemått', 'Aktivitet', 'Sömn', 'Vikt'],
    );

    assert.equal(model.factors[0]?.statusLabel, 'Positiv utveckling');
    assert.equal(model.factors[1]?.statusLabel, 'Positiv utveckling');
    assert.equal(model.factors[2]?.statusLabel, t('explained.sleep.status'));
    assert.equal(model.factors[2]?.body, t('explained.sleep.body'));
    assert.equal(model.factors[2]?.tone, 'limitation');
    assert.equal(model.factors[3]?.statusLabel, 'Positiv utveckling');
    assert.equal(model.factors[3]?.tone, 'positive');
    assert.equal(model.factors[3]?.body, 'Din vikt har minskat sedan senaste mätningen.');

    assert.equal(model.coach.available, true);
    if (model.coach.available) {
      assert.equal(model.coach.title, 'Promenad efter middagen');
    }
  });

  it('maps weight increase to negative development and unchanged to oförändrad', () => {
    const increased = buildHealthScoreExplainedViewModel({
      ...comparableHome,
      weight: {
        status: 'ready',
        current: 84,
        previous: 82,
        change: 2,
      },
    });
    assert.equal(increased.factors[3]?.statusLabel, 'Negativ utveckling');
    assert.equal(increased.factors[3]?.tone, 'negative');
    assert.equal(increased.factors[3]?.body, 'Din vikt har ökat sedan senaste mätningen.');

    const unchanged = buildHealthScoreExplainedViewModel({
      ...comparableHome,
      weight: {
        status: 'ready',
        current: 80,
        previous: 80,
        change: 0,
      },
    });
    assert.equal(unchanged.factors[3]?.statusLabel, 'Oförändrad');
    assert.equal(unchanged.factors[3]?.tone, 'neutral');
  });

  it('keeps sleep as an explicit limitation without trend claims', () => {
    const model = buildHealthScoreExplainedViewModel(comparableHome);
    const sleep = model.factors.find((factor) => factor.id === 'sleep');

    assert.ok(sleep);
    assert.equal(sleep.statusLabel, 'Ingen data');
    assert.match(sleep.body, /ingår inte i den nuvarande Health Score/);
    assert.doesNotMatch(sleep.body, /Förbättringspotential|steg|Garmin/i);
  });

  it('maps insufficient history without inventing deltas', () => {
    const model = buildHealthScoreExplainedViewModel(singleSnapshotHome);

    assert.equal(model.historyStatus, 'insufficient_history');
    assert.equal(model.scoreChange.status, 'insufficient_history');
    assert.equal(model.factors[0]?.statusLabel, 'För lite historik');
    assert.equal(model.factors[1]?.statusLabel, 'För lite historik');
    assert.equal(model.factors[2]?.statusLabel, t('explained.sleep.status'));
    assert.equal(model.factors[3]?.statusLabel, 'För lite historik');
    assert.equal(model.coach.available, false);
  });

  it('describes activity as Health Score activity level, not steps/device data', () => {
    const model = buildHealthScoreExplainedViewModel(comparableHome);
    const activity = model.factors.find((factor) => factor.id === 'activity');

    assert.ok(activity);
    assert.match(activity.body, /aktivitetsnivå i Health Score/i);
    assert.doesNotMatch(activity.body, /steg|Garmin|enhet/i);
  });

  it('does not claim weight contributes Health Score points', () => {
    const model = buildHealthScoreExplainedViewModel(comparableHome);
    const weight = model.factors.find((factor) => factor.id === 'weight');

    assert.ok(weight);
    assert.equal(weight.statusLabel, 'Positiv utveckling');
    assert.doesNotMatch(weight.body, /poäng|bidrar|påverkar din Health Score med/i);
  });
});

describe('mapHealthScoreExplainedSummaryToFetchState', () => {
  it('maps empty summary without fake values', () => {
    const state = mapHealthScoreExplainedSummaryToFetchState({ status: 'empty' });
    assert.deepEqual(state, {
      status: 'empty',
      message: getHealthScoreExplainedEmptyMessage(),
    });
  });

  it('maps comparable ready summary to ready fetch state', () => {
    const state = mapHealthScoreExplainedSummaryToFetchState(comparableHome);
    assert.equal(state.status, 'ready');
    if (state.status === 'ready') {
      assert.equal(state.model.currentScore, 74);
    }
  });

  it('maps one-snapshot summary to insufficient_history fetch state', () => {
    const state = mapHealthScoreExplainedSummaryToFetchState(singleSnapshotHome);
    assert.equal(state.status, 'insufficient_history');
    if (state.status === 'insufficient_history') {
      assert.equal(state.model.historyStatus, 'insufficient_history');
    }
  });
});

describe('Health Score Explained learn-more CTA', () => {
  it('does not expose a Hur beräknas Health Score? destination', () => {
    assert.equal(HEALTH_SCORE_EXPLAINED_LEARN_MORE_DESTINATION, null);
  });
});
