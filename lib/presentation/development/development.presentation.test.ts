import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type {
  DevelopmentHomeSummary,
  DevelopmentTrendsSummary,
} from '../../services/development';
import { setActiveLocale, t } from '../../i18n';

import {
  DEVELOPMENT_FACTORS_CTA_LABEL,
  DEVELOPMENT_FACTORS_CTA_ROUTE,
  DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE,
  DEVELOPMENT_METRIC_OPTIONS,
  DEVELOPMENT_PERIOD_OPTIONS,
  buildDevelopmentChartPoints,
  buildDevelopmentHomeViewModel,
  buildDevelopmentTrendsViewModel,
  formatDevelopmentChartDateLabel,
  formatDevelopmentPeriodChange,
  formatDevelopmentScoreChange,
  getDevelopmentHomeInsufficientMessage,
  mapDevelopmentHomeSummaryToFetchState,
  mapDevelopmentTrendsSummaryToFetchState,
  resolveDevelopmentTrendChartDomain,
} from './development.presentation';
import { ACTIVITY_TREND_LEVEL_DOMAIN } from './development-activity-level';
import { buildDevelopmentTrendChartCoords } from './development-trend-chart.layout';

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
    current: 68,
    previous: 50,
    change: 18,
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
        tone: 'positive',
        text: '↑ +6 sedan senaste uppdateringen',
      },
    );

    assert.deepEqual(
      formatDevelopmentScoreChange({
        status: 'ready',
        current: 60,
        previous: 65,
        change: -5,
      }),
      {
        status: 'ready',
        direction: 'down',
        tone: 'negative',
        text: '↓ -5 sedan senaste uppdateringen',
      },
    );

    assert.deepEqual(
      formatDevelopmentScoreChange({
        status: 'ready',
        current: 70,
        previous: 70,
        change: 0,
      }),
      {
        status: 'ready',
        direction: 'stable',
        tone: 'neutral',
        text: '— Oförändrad sedan senaste uppdateringen',
      },
    );
  });

  it('uses insufficient-history presentation text', () => {
    const view = formatDevelopmentScoreChange({
      status: 'insufficient_history',
      current: 70,
    });
    assert.equal(view.status, 'insufficient_history');
    assert.equal(view.tone, 'neutral');
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
    assert.equal(midja.tone, 'positive');

    const vikt = model.drivers[1]!;
    assert.equal(vikt.valueText, '80,0 kg');
    assert.equal(vikt.changeText, '−2,0 kg');
    assert.equal(vikt.tone, 'positive');

    const aktivitet = model.drivers[2]!;
    assert.equal(aktivitet.valueText, 'Måttlig');
    assert.equal(aktivitet.changeText, 'Lätt → Måttlig');
    assert.equal(aktivitet.tone, 'positive');
    assert.match(aktivitet.changeText, /→/);
    assert.equal(aktivitet.changeText.includes('+18'), false);
    assert.equal(aktivitet.changeText.includes('+8'), false);

    const somn = model.drivers[3]!;
    assert.equal(somn.valueText, 'Ingen data');
    assert.equal(somn.changeText, null);
    assert.equal(somn.state, 'limitation');
    assert.equal(somn.tone, 'limitation');
  });

  it('renders concise SV/NB activity-level transitions from ACTIVITY_SCORES', () => {
    setActiveLocale('sv');
    const lightToModerate = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 68, previous: 50, change: 18 },
    }).drivers[2]!;
    assert.equal(lightToModerate.changeText, 'Lätt → Måttlig');

    const sedentaryToLight = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 50, previous: 35, change: 15 },
    }).drivers[2]!;
    assert.equal(sedentaryToLight.changeText, 'Stillasittande → Lätt');

    const moderateToVery = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 82, previous: 68, change: 14 },
    }).drivers[2]!;
    assert.equal(moderateToVery.changeText, 'Måttlig → Mycket');
    assert.equal(moderateToVery.changeText.includes('+14'), false);

    const veryToElite = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 92, previous: 82, change: 10 },
    }).drivers[2]!;
    assert.equal(veryToElite.changeText, 'Mycket → Elitidrottare');

    const unchangedActivity = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 82, previous: 82, change: 0 },
    }).drivers[2]!;
    assert.equal(unchangedActivity.valueText, 'Mycket');
    assert.equal(unchangedActivity.changeText, 'Oförändrad');
    assert.equal(unchangedActivity.changeText.includes('Mycket → Mycket'), false);

    setActiveLocale('nb');
    const nbUnchangedActivity = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 82, previous: 82, change: 0 },
    }).drivers[2]!;
    assert.equal(nbUnchangedActivity.changeText, 'Uendret');
    setActiveLocale('sv');

    setActiveLocale('nb');
    const nbTransition = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 68, previous: 50, change: 18 },
    }).drivers[2]!;
    assert.equal(nbTransition.changeText, 'Lett → Moderat');
    setActiveLocale('sv');
  });

  it('does not show a raw activity-score delta when a level cannot be mapped', () => {
    const row = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 58, previous: 50, change: 8 },
    }).drivers[2]!;
    assert.equal(row.changeText, t('development.insufficientHistory'));
    assert.equal(row.state, 'insufficient_history');
    assert.equal(row.changeText?.includes('+8'), false);
    assert.equal(row.changeText?.includes('+18'), false);
  });

  it('renders unchanged weight as Oförändrad / Uendret and keeps non-zero kg formatting', () => {
    setActiveLocale('sv');
    const unchanged = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 80, previous: 80, change: 0 },
    }).drivers[1]!;
    assert.equal(unchanged.changeText, 'Oförändrad');
    assert.equal(unchanged.changeText.includes('0,0'), false);

    const nearZero = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 80.02, previous: 80, change: 0.02 },
    }).drivers[1]!;
    assert.equal(nearZero.changeText, 'Oförändrad');

    const down = buildDevelopmentHomeViewModel(readyHome).drivers[1]!;
    assert.equal(down.changeText, '−2,0 kg');

    const up = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 81.2, previous: 80, change: 1.2 },
    }).drivers[1]!;
    assert.equal(up.changeText, '+1,2 kg');
    assert.equal(up.tone, 'negative');

    setActiveLocale('nb');
    const nbUnchanged = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 80, previous: 80, change: 0 },
    }).drivers[1]!;
    assert.equal(nbUnchanged.changeText, 'Uendret');
    setActiveLocale('sv');
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

describe('Development Home semantic tones', () => {
  it('colors Health Score, weight, waist and activity from derived change, not formatted strings', () => {
    const down = formatDevelopmentScoreChange({
      status: 'ready',
      current: 76,
      previous: 84,
      change: -8,
    });
    assert.equal(down.direction, 'down');
    assert.equal(down.tone, 'negative');

    const up = formatDevelopmentScoreChange({
      status: 'ready',
      current: 80,
      previous: 76,
      change: 4,
    });
    assert.equal(up.direction, 'up');
    assert.equal(up.tone, 'positive');

    const stable = formatDevelopmentScoreChange({
      status: 'ready',
      current: 76,
      previous: 76,
      change: 0,
    });
    assert.equal(stable.direction, 'stable');
    assert.equal(stable.tone, 'neutral');

    const heavier = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 95, previous: 74, change: 21 },
      waist: { status: 'ready', current: 90, previous: 87, change: 3 },
    });
    assert.equal(heavier.drivers[1]!.changeText, '+21,0 kg');
    assert.equal(heavier.drivers[1]!.tone, 'negative');
    assert.equal(heavier.drivers[0]!.changeText, '+3 cm');
    assert.equal(heavier.drivers[0]!.tone, 'negative');

    const lighter = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 93, previous: 95, change: -2 },
      waist: { status: 'ready', current: 89, previous: 90, change: -1 },
    });
    assert.equal(lighter.drivers[1]!.tone, 'positive');
    assert.equal(lighter.drivers[0]!.tone, 'positive');

    const unchanged = buildDevelopmentHomeViewModel({
      ...readyHome,
      weight: { status: 'ready', current: 95, previous: 95, change: 0 },
      waist: { status: 'ready', current: 90, previous: 90, change: 0 },
      activity: { status: 'ready', current: 82, previous: 82, change: 0 },
    });
    assert.equal(unchanged.drivers[1]!.changeText, 'Oförändrad');
    assert.equal(unchanged.drivers[1]!.tone, 'neutral');
    assert.equal(unchanged.drivers[0]!.changeText, '0 cm');
    assert.equal(unchanged.drivers[0]!.tone, 'neutral');
    assert.equal(unchanged.drivers[2]!.changeText, 'Oförändrad');
    assert.equal(unchanged.drivers[2]!.tone, 'neutral');

    const activityUp = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 82, previous: 68, change: 14 },
    }).drivers[2]!;
    assert.equal(activityUp.changeText, 'Måttlig → Mycket');
    assert.equal(activityUp.tone, 'positive');

    const activityDown = buildDevelopmentHomeViewModel({
      ...readyHome,
      activity: { status: 'ready', current: 68, previous: 82, change: -14 },
    }).drivers[2]!;
    assert.equal(activityDown.changeText, 'Mycket → Måttlig');
    assert.equal(activityDown.tone, 'negative');

    const sleep = heavier.drivers[3]!;
    assert.equal(sleep.state, 'limitation');
    assert.equal(sleep.tone, 'limitation');
    assert.equal(sleep.valueText, 'Ingen data');
  });
});

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
      { capturedAt: '2026-08-08T10:00:00.000Z', value: 68 },
    ],
  },
  coach: readyHome.coach,
};

describe('buildDevelopmentTrendsViewModel', () => {
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

  it('builds chart points with date labels and categorical activity labels', () => {
    setActiveLocale('sv');
    const model = buildDevelopmentTrendsViewModel(trends, 'activity');
    assert.equal(model.periodLabel, '30 dagar');
    assert.equal(model.periodChange.text, '↑ +10 under perioden');
    assert.equal(model.periodChange.status, 'ready');
    if (model.periodChange.status === 'ready') {
      assert.equal(model.periodChange.tone, 'positive');
    }
    assert.equal(model.hasSufficientHistory, true);
    assert.equal(model.chartPoints.length, 2);
    assert.equal(model.chartPoints[0]!.valueLabel, 'Lätt');
    assert.equal(model.chartPoints[1]!.valueLabel, 'Måttlig');
    assert.deepEqual(model.chartValueDomain, ACTIVITY_TREND_LEVEL_DOMAIN);
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
    assert.equal(formatDevelopmentPeriodChange(null, false).tone, 'neutral');
  });

  it('colors the Trends period pill from overall Health Score, not the selected metric', () => {
    const downSummary = { ...trends, periodChange: -2 };
    const downHealth = buildDevelopmentTrendsViewModel(downSummary, 'health_score');
    const downWeight = buildDevelopmentTrendsViewModel(downSummary, 'weight');
    const downWaist = buildDevelopmentTrendsViewModel(downSummary, 'waist');
    const downActivity = buildDevelopmentTrendsViewModel(downSummary, 'activity');

    assert.equal(downHealth.periodChange.status, 'ready');
    if (downHealth.periodChange.status === 'ready') {
      assert.equal(downHealth.periodChange.direction, 'down');
      assert.equal(downHealth.periodChange.tone, 'negative');
      assert.equal(downHealth.periodChange.text, '↓ -2 under perioden');
    }
    assert.deepEqual(downWeight.periodChange, downHealth.periodChange);
    assert.deepEqual(downWaist.periodChange, downHealth.periodChange);
    assert.deepEqual(downActivity.periodChange, downHealth.periodChange);

    const up = formatDevelopmentPeriodChange(4, true);
    assert.equal(up.status, 'ready');
    if (up.status === 'ready') {
      assert.equal(up.tone, 'positive');
    }

    const stable = formatDevelopmentPeriodChange(0, true);
    assert.equal(stable.status, 'ready');
    if (stable.status === 'ready') {
      assert.equal(stable.tone, 'neutral');
    }
  });
});

describe('Development Trends Activity presentation', () => {
  const activityHistory: DevelopmentTrendsSummary = {
    ...trends,
    series: {
      ...trends.series,
      activity: [
        { capturedAt: '2026-08-01T10:00:00.000Z', value: 50 },
        { capturedAt: '2026-08-08T10:00:00.000Z', value: 68 },
        { capturedAt: '2026-08-15T10:00:00.000Z', value: 82 },
      ],
    },
  };

  it('maps frozen activity scores to localized concise level names', () => {
    const expected = {
      sv: ['Lätt', 'Måttlig', 'Mycket'],
      nb: ['Lett', 'Moderat', 'Svært'],
    } as const;

    for (const locale of ['sv', 'nb'] as const) {
      setActiveLocale(locale);
      const points = buildDevelopmentChartPoints(activityHistory, 'activity');
      assert.deepEqual(
        points.map((point) => point.valueLabel),
        [...expected[locale]],
      );
      assert.deepEqual(
        points.map((point) => point.value),
        [1, 2, 3],
      );
    }

    setActiveLocale('sv');
    const unknown = buildDevelopmentChartPoints(
      {
        ...activityHistory,
        series: {
          ...activityHistory.series,
          activity: [{ capturedAt: '2026-08-01T10:00:00.000Z', value: 58 }],
        },
      },
      'activity',
    );
    assert.equal(unknown[0]!.valueLabel, t('development.insufficientHistory'));
    assert.equal(Number.isFinite(unknown[0]!.value), false);
  });

  it('does not expose raw activity_score numbers as Activity value labels', () => {
    setActiveLocale('sv');
    const points = buildDevelopmentChartPoints(
      {
        ...activityHistory,
        series: {
          ...activityHistory.series,
          activity: [
            { capturedAt: '2026-08-01T10:00:00.000Z', value: 35 },
            { capturedAt: '2026-08-08T10:00:00.000Z', value: 50 },
            { capturedAt: '2026-08-15T10:00:00.000Z', value: 68 },
            { capturedAt: '2026-08-22T10:00:00.000Z', value: 82 },
            { capturedAt: '2026-08-29T10:00:00.000Z', value: 92 },
          ],
        },
      },
      'activity',
    );

    assert.deepEqual(
      points.map((point) => point.valueLabel),
      ['Stillasittande', 'Lätt', 'Måttlig', 'Mycket', 'Elitidrottare'],
    );
    for (const raw of ['35', '50', '68', '82', '92']) {
      assert.equal(
        points.some((point) => point.valueLabel === raw),
        false,
      );
    }
  });

  it('uses a fixed five-level Activity domain so one-level changes do not fill the chart', () => {
    assert.deepEqual(resolveDevelopmentTrendChartDomain('activity'), ACTIVITY_TREND_LEVEL_DOMAIN);
    assert.equal(ACTIVITY_TREND_LEVEL_DOMAIN.min, 0);
    assert.equal(ACTIVITY_TREND_LEVEL_DOMAIN.max, 4);

    const width = 200;
    const height = 100;
    const usableHeight = height - 16;
    const oneLevel = buildDevelopmentTrendChartCoords(
      [1, 2],
      width,
      height,
      ACTIVITY_TREND_LEVEL_DOMAIN,
    );
    const autoScaled = buildDevelopmentTrendChartCoords([1, 2], width, height, null);

    const categoricalStep = Math.abs(oneLevel[1]!.y - oneLevel[0]!.y);
    const autoStep = Math.abs(autoScaled[1]!.y - autoScaled[0]!.y);

    assert.ok(Math.abs(categoricalStep - usableHeight / 4) < 0.01);
    assert.ok(autoStep > usableHeight * 0.99);
    assert.ok(categoricalStep < autoStep / 2);
  });

  it('leaves Health Score, weight, waist and neck chart domains auto-scaled', () => {
    for (const metric of ['health_score', 'weight', 'waist', 'neck'] as const) {
      assert.equal(resolveDevelopmentTrendChartDomain(metric), null);
    }

    const width = 200;
    const height = 100;
    const usableHeight = height - 16;
    const cases = [
      { metric: 'health_score' as const, values: [64, 74] },
      { metric: 'weight' as const, values: [82, 80] },
      { metric: 'waist' as const, values: [92, 90] },
      { metric: 'neck' as const, values: [39, 38] },
    ];

    for (const { metric, values } of cases) {
      const points = buildDevelopmentChartPoints(trends, metric);
      assert.deepEqual(
        points.map((point) => point.value),
        values,
      );
      const coords = buildDevelopmentTrendChartCoords(
        points.map((point) => point.value),
        width,
        height,
        resolveDevelopmentTrendChartDomain(metric),
      );
      assert.ok(Math.abs(coords[1]!.y - coords[0]!.y) > usableHeight * 0.99);
    }
  });
});

describe('Development Factors CTA', () => {
  it('navigates Vad påverkar min Health Score? to the existing Health Score Explained surface', () => {
    assert.equal(DEVELOPMENT_FACTORS_CTA_LABEL(), 'Vad påverkar min Health Score?');
    assert.equal(DEVELOPMENT_FACTORS_CTA_ROUTE, '/health-score');
  });
});
