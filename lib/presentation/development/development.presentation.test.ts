import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  DevelopmentHomeSummary,
  DevelopmentTrendsSummary,
} from '../../services/development';
import { t } from '../../i18n';

import {
  DEVELOPMENT_FACTORS_CTA_LABEL,
  DEVELOPMENT_FACTORS_CTA_ROUTE,
  DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE,
  DEVELOPMENT_METRIC_OPTIONS,
  DEVELOPMENT_PERIOD_OPTIONS,
  buildDevelopmentHomeViewModel,
  buildDevelopmentTrendsViewModel,
  formatDevelopmentChartDateLabel,
  formatDevelopmentPeriodChange,
  formatDevelopmentScoreChange,
  getDevelopmentHomeInsufficientMessage,
  mapDevelopmentHomeSummaryToFetchState,
  mapDevelopmentTrendsSummaryToFetchState,
} from './development.presentation';

const readyHome: Extract<DevelopmentHomeSummary, { status: 'ready' }> = {
  status: 'ready',
  latestSnapshotId: 's2',
  latestCapturedAt: '2026-08-08T10:00:00.000Z',
  currentScore: 74,
  scoreChange: {
    status: 'ready',
    current: 74,
    previous: 68,
    change: 6,
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

describe('formatDevelopmentScoreChange', () => {
  it('formats improving / declining / stable with Home-aligned Swedish copy', () => {
    assert.deepEqual(
      formatDevelopmentScoreChange({
        status: 'ready',
        current: 74,
        previous: 68,
        change: 6,
      }),
      {
        status: 'ready',
        direction: 'up',
        text: '↑ +6 sedan senaste uppdateringen',
      },
    );

    assert.equal(
      formatDevelopmentScoreChange({
        status: 'ready',
        current: 60,
        previous: 65,
        change: -5,
      }).text,
      '↓ -5 sedan senaste uppdateringen',
    );

    assert.equal(
      formatDevelopmentScoreChange({
        status: 'ready',
        current: 70,
        previous: 70,
        change: 0,
      }).text,
      '— Oförändrad sedan senaste uppdateringen',
    );
  });

  it('uses insufficient-history presentation text', () => {
    const view = formatDevelopmentScoreChange({
      status: 'insufficient_history',
      current: 70,
    });
    assert.equal(view.status, 'insufficient_history');
    assert.equal(view.text, t('development.insufficientHistory'));
  });
});

describe('buildDevelopmentHomeViewModel', () => {
  it('builds display-ready driver rows including sleep limitation', () => {
    const model = buildDevelopmentHomeViewModel(readyHome);

    assert.equal(model.currentScore, 74);
    assert.equal(model.scoreBandLabel, 'Bra hälsonivå');
    assert.equal(model.historyStatus, 'comparable');
    assert.equal(model.coach.available, true);

    assert.deepEqual(
      model.drivers.map((row) => row.label),
      ['Midja', 'Vikt', 'Aktivitet', 'Sömn'],
    );

    const midja = model.drivers[0]!;
    assert.equal(midja.valueText, '90 cm');
    assert.equal(midja.changeText, '−2 cm');
    assert.equal(midja.state, 'ready');

    const vikt = model.drivers[1]!;
    assert.equal(vikt.valueText, '80,0 kg');
    assert.equal(vikt.changeText, '−2,0 kg');

    const aktivitet = model.drivers[2]!;
    assert.equal(aktivitet.valueText, '58');
    assert.equal(aktivitet.changeText, '+8');

    const somn = model.drivers[3]!;
    assert.equal(somn.valueText, 'Ingen data');
    assert.equal(somn.changeText, null);
    assert.equal(somn.state, 'limitation');
  });

  it('maps one-snapshot summary to insufficient_history fetch state', () => {
    const summary: DevelopmentHomeSummary = {
      ...readyHome,
      trend: 'insufficient_history',
      scoreChange: { status: 'insufficient_history', current: 74 },
      weight: { status: 'insufficient_history', current: 80 },
      waist: { status: 'insufficient_history', current: 90 },
      activity: { status: 'insufficient_history', current: 58 },
    };

    const state = mapDevelopmentHomeSummaryToFetchState(summary);
    assert.equal(state.status, 'insufficient_history');
    if (state.status !== 'insufficient_history') {
      return;
    }

    assert.equal(state.model.historyStatus, 'insufficient_history');
    assert.equal(state.model.scoreChange.status, 'insufficient_history');
    assert.equal(state.model.drivers[0]!.state, 'insufficient_history');
  });

  it('maps empty summary to empty fetch state', () => {
    const state = mapDevelopmentHomeSummaryToFetchState({ status: 'empty' });
    assert.equal(state.status, 'empty');
  });

  it('exposes Home-aligned insufficient-history copy and the existing measurement route', () => {
    assert.equal(
      getDevelopmentHomeInsufficientMessage(),
      'Din första hälsomätning är sparad. Spara en ny mätning för att kunna jämföra din utveckling över tid.',
    );
    assert.equal(DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE, '/(tabs)/health/new-measurement');
  });
});

describe('buildDevelopmentTrendsViewModel', () => {
  const trends: DevelopmentTrendsSummary = {
    period: '30d',
    periodSince: '2026-07-09T12:00:00.000Z',
    currentScore: 74,
    periodChange: 10,
    hasSufficientHistory: true,
    series: {
      healthScore: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 64 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 74 },
      ],
      weight: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 82 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 80 },
      ],
      waist: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 92 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 90 },
      ],
      neck: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 39 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 38 },
      ],
      activity: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 50 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 58 },
      ],
    },
    coach: readyHome.coach,
  };

  it('exposes Swedish period and metric selector labels', () => {
    assert.deepEqual(
      DEVELOPMENT_PERIOD_OPTIONS.map((o) => o.label),
      ['7 dagar', '30 dagar', '90 dagar', '1 år'],
    );
    assert.deepEqual(
      DEVELOPMENT_METRIC_OPTIONS.map((o) => o.label),
      ['Health Score', 'Vikt', 'Midja', 'Hals', 'Aktivitet'],
    );
  });

  it('builds chart points with date labels and metric value labels', () => {
    const model = buildDevelopmentTrendsViewModel(trends, 'activity');
    assert.equal(model.periodLabel, '30 dagar');
    assert.equal(model.periodChange.text, '↑ +10 under perioden');
    assert.equal(model.hasSufficientHistory, true);
    assert.equal(model.chartPoints.length, 2);
    assert.equal(model.chartPoints[0]!.valueLabel, '50');
    assert.equal(model.chartPoints[1]!.valueLabel, '58');
    assert.equal(
      model.chartPoints[0]!.dateLabel,
      formatDevelopmentChartDateLabel('2026-08-01T10:00:00.000Z'),
    );
  });

  it('marks insufficient history when fewer than 2 points', () => {
    const sparse: DevelopmentTrendsSummary = {
      ...trends,
      periodChange: null,
      hasSufficientHistory: false,
      series: {
        ...trends.series,
        healthScore: [{ capturedAt: '2026-08-08T10:00:00.000Z', value: 74 }],
        weight: [{ capturedAt: '2026-08-08T10:00:00.000Z', value: 80 }],
        waist: [{ capturedAt: '2026-08-08T10:00:00.000Z', value: 90 }],
        neck: [{ capturedAt: '2026-08-08T10:00:00.000Z', value: 38 }],
        activity: [{ capturedAt: '2026-08-08T10:00:00.000Z', value: 58 }],
      },
    };

    const state = mapDevelopmentTrendsSummaryToFetchState(sparse, 'health_score');
    assert.equal(state.status, 'insufficient_history');
    assert.equal(
      formatDevelopmentPeriodChange(null, false).text,
      t('development.insufficientHistory'),
    );
  });
});

describe('Development Factors CTA', () => {
  it('navigates Vad påverkar min Health Score? to the existing Health Score Explained surface', () => {
    assert.equal(DEVELOPMENT_FACTORS_CTA_LABEL(), 'Vad påverkar min Health Score?');
    assert.equal(DEVELOPMENT_FACTORS_CTA_ROUTE, '/health-score');
  });
});
