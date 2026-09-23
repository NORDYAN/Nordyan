import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Measurement } from '../../domain/measurement';
import type { HealthSnapshot } from '../../domain/snapshot';

import {
  assertSeriesAscending,
  buildActivityLevelDelta,
  buildDevelopmentHomeSummary,
  buildDevelopmentMetricSeries,
  buildObservedCircumferenceDelta,
  buildDevelopmentTrendsSummary,
  resolveDevelopmentPeriodSince,
} from './development.derivation';
import { DEVELOPMENT_SLEEP_LIMITATION_MESSAGE } from './development.types';

function snapshot(overrides: Partial<HealthSnapshot> & Pick<HealthSnapshot, 'id' | 'createdAt'>): HealthSnapshot {
  return {
    userId: 'user-1',
    overallScore: 70,
    bmiScore: 70,
    whtrScore: 70,
    bodyFatScore: 70,
    activityScore: 60,
    primaryFocus: 'reduce_waist',
    coachRecommendationId: 'waist_walk_after_dinner_v1',
    weightKg: 80,
    waistCm: 90,
    neckCm: 38,
    engineVersion: '1.0.0',
    snapshotReason: 'measurement',
    bodyFatPct: null,
    coachDurationMinutes: 30,
    coachFrequencyPerWeek: 4,
    ...overrides,
  };
}

function measurement(
  overrides: Partial<Measurement> & Pick<Measurement, 'id' | 'measuredAt' | 'createdAt'>,
): Measurement {
  return {
    userId: 'user-1',
    weightKg: 80,
    waistCm: 90,
    neckCm: 38,
    hipCm: 95,
    ...overrides,
  };
}

describe('buildDevelopmentHomeSummary', () => {
  it('returns empty when no snapshots', () => {
    const summary = buildDevelopmentHomeSummary({ latest: null, previous: null });
    assert.equal(summary.status, 'empty');
  });

  it('marks latest-vs-previous as insufficient with one snapshot', () => {
    const latest = snapshot({
      id: 's1',
      createdAt: '2026-08-08T10:00:00.000Z',
      overallScore: 72,
      activityScore: 55,
    });

    const summary = buildDevelopmentHomeSummary({ latest, previous: null });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.equal(summary.currentScore, 72);
    assert.equal(summary.trend, 'insufficient_history');
    assert.equal(summary.scoreChange.status, 'insufficient_history');
    assert.equal(summary.weight.status, 'insufficient_history');
    assert.equal(summary.waist.status, 'insufficient_history');
    assert.equal(summary.activity.status, 'insufficient_history');
    assert.equal(summary.weight.current, null);
    assert.equal(summary.waist.current, null);
    assert.equal(summary.sleep.message, DEVELOPMENT_SLEEP_LIMITATION_MESSAGE);
    assert.equal(summary.coach.available, true);
  });

  it('computes latest vs previous deltas including activity_score', () => {
    const previous = snapshot({
      id: 's1',
      createdAt: '2026-08-01T10:00:00.000Z',
      overallScore: 68,
      weightKg: 82,
      waistCm: 92,
      activityScore: 50,
    });
    const latest = snapshot({
      id: 's2',
      createdAt: '2026-08-08T10:00:00.000Z',
      overallScore: 74,
      weightKg: 80,
      waistCm: 90,
      activityScore: 68,
    });
    const measurements = [
      measurement({
        id: 'm2',
        measuredAt: '2026-08-08',
        createdAt: '2026-08-08T10:00:00.000Z',
        weightKg: 80,
        waistCm: 90,
      }),
      measurement({
        id: 'm1',
        measuredAt: '2026-08-01',
        createdAt: '2026-08-01T10:00:00.000Z',
        weightKg: 82,
        waistCm: 92,
      }),
    ];

    const summary = buildDevelopmentHomeSummary({
      latest,
      previous,
      measurementsNewestFirst: measurements,
      activitySnapshotsNewestFirst: [latest, previous],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.equal(summary.trend, 'improving');
    assert.deepEqual(summary.scoreChange, {
      status: 'ready',
      current: 74,
      previous: 68,
      change: 6,
    });
    assert.deepEqual(summary.weight, {
      status: 'ready',
      current: 80,
      previous: 82,
      change: -2,
    });
    assert.deepEqual(summary.waist, {
      status: 'ready',
      current: 90,
      previous: 92,
      change: -2,
    });
    assert.deepEqual(summary.activity, {
      status: 'ready',
      current: 68,
      previous: 50,
      change: 18,
    });
    assert.equal(summary.sleep.status, 'limitation');
    assert.equal(summary.sleep.message, 'Ingen data');
  });

  it('treats two snapshots as comparable even when captured minutes apart on the same day', () => {
    const previous = snapshot({
      id: 's-am',
      createdAt: '2026-08-16T10:00:00.000Z',
      overallScore: 70,
      weightKg: 81,
      waistCm: 91,
      activityScore: 50,
    });
    const latest = snapshot({
      id: 's-pm',
      createdAt: '2026-08-16T10:04:00.000Z',
      overallScore: 71,
      weightKg: 80.5,
      waistCm: 90.5,
      activityScore: 68,
    });

    const summary = buildDevelopmentHomeSummary({
      latest,
      previous,
      measurementsNewestFirst: [
        measurement({
          id: 'm-pm',
          measuredAt: '2026-08-16',
          createdAt: '2026-08-16T10:04:00.000Z',
          weightKg: 80.5,
          waistCm: 90.5,
        }),
        measurement({
          id: 'm-am',
          measuredAt: '2026-08-16',
          createdAt: '2026-08-16T10:00:00.000Z',
          weightKg: 81,
          waistCm: 91,
        }),
      ],
      activitySnapshotsNewestFirst: [latest, previous],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.equal(summary.scoreChange.status, 'ready');
    assert.equal(summary.weight.status, 'ready');
    assert.equal(summary.waist.status, 'ready');
    assert.equal(summary.activity.status, 'ready');
    assert.notEqual(summary.trend, 'insufficient_history');
  });

  it('does not use imputed onboarding waist as a delta baseline', () => {
    const onboarding = snapshot({
      id: 'onboarding',
      createdAt: '2026-08-01T10:00:00.000Z',
      snapshotReason: 'onboarding',
      overallScore: 70,
      weightKg: 80,
      waistCm: 85,
      neckCm: 36,
      activityScore: 55,
    });
    const firstMeasurement = snapshot({
      id: 'measured',
      createdAt: '2026-08-10T10:00:00.000Z',
      snapshotReason: 'measurement',
      overallScore: 72,
      weightKg: 90,
      waistCm: 90,
      neckCm: 38,
      activityScore: 56,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: firstMeasurement,
      previous: onboarding,
      measurementsNewestFirst: [
        measurement({
          id: 'measured',
          measuredAt: '2026-08-10',
          createdAt: '2026-08-10T10:00:00.000Z',
          weightKg: 90,
          waistCm: 90,
        }),
      ],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.deepEqual(summary.waist, {
      status: 'insufficient_history',
      current: 90,
    });
    assert.deepEqual(summary.weight, {
      status: 'insufficient_history',
      current: 90,
    });
    assert.deepEqual(summary.scoreChange, {
      status: 'ready',
      current: 72,
      previous: 70,
      change: 2,
    });
    assert.equal(summary.activity.status, 'insufficient_history');
    assert.deepEqual(
      buildObservedCircumferenceDelta(
        firstMeasurement,
        onboarding,
        (item) => item.neckCm,
      ),
      { status: 'insufficient_history', current: 38 },
    );
  });

  it('shows waist and neck deltas only between two measurement snapshots', () => {
    const first = snapshot({
      id: 'm1',
      createdAt: '2026-08-10T10:00:00.000Z',
      snapshotReason: 'measurement',
      weightKg: 90,
      waistCm: 90,
      neckCm: 38,
    });
    const second = snapshot({
      id: 'm2',
      createdAt: '2026-08-20T10:00:00.000Z',
      snapshotReason: 'measurement',
      weightKg: 88,
      waistCm: 86,
      neckCm: 37,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: second,
      previous: first,
      measurementsNewestFirst: [
        measurement({
          id: 'm2',
          measuredAt: '2026-08-20',
          createdAt: '2026-08-20T10:00:00.000Z',
          weightKg: 88,
          waistCm: 86,
          neckCm: 37,
        }),
        measurement({
          id: 'm1',
          measuredAt: '2026-08-10',
          createdAt: '2026-08-10T10:00:00.000Z',
          weightKg: 90,
          waistCm: 90,
          neckCm: 38,
        }),
      ],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.deepEqual(summary.waist, {
      status: 'ready',
      current: 86,
      previous: 90,
      change: -4,
    });
    assert.deepEqual(
      buildObservedCircumferenceDelta(second, first, (item) => item.neckCm),
      {
        status: 'ready',
        current: 37,
        previous: 38,
        change: -1,
      },
    );
  });

  it('compares the latest two real measurements after a carrying profile_update', () => {
    const m1 = measurement({
      id: 'm1',
      measuredAt: '2026-09-21',
      createdAt: '2026-09-21T08:00:00.000Z',
      weightKg: 78,
      waistCm: 90,
    });
    const m2 = measurement({
      id: 'm2',
      measuredAt: '2026-09-22',
      createdAt: '2026-09-22T08:00:00.000Z',
      weightKg: 76,
      waistCm: 88,
    });
    const m3 = measurement({
      id: 'm3',
      measuredAt: '2026-09-23',
      createdAt: '2026-09-23T08:00:00.000Z',
      weightKg: 74,
      waistCm: 87,
    });
    const measurementSnapshot = snapshot({
      id: 'snap-m3',
      createdAt: '2026-09-23T08:00:00.000Z',
      snapshotReason: 'measurement',
      overallScore: 76,
      weightKg: 74,
      waistCm: 87,
      activityScore: 82,
    });
    const profileUpdate = snapshot({
      id: 'snap-profile',
      createdAt: '2026-09-23T10:00:00.000Z',
      snapshotReason: 'profile_update',
      overallScore: 80,
      weightKg: 74,
      waistCm: 87,
      activityScore: 82,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: profileUpdate,
      previous: measurementSnapshot,
      measurementsNewestFirst: [m3, m2, m1],
      activitySnapshotsNewestFirst: [profileUpdate, measurementSnapshot],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.deepEqual(summary.weight, {
      status: 'ready',
      current: 74,
      previous: 76,
      change: -2,
    });
    assert.deepEqual(summary.waist, {
      status: 'ready',
      current: 87,
      previous: 88,
      change: -1,
    });
    assert.notEqual(summary.waist.status, 'insufficient_history');
    assert.deepEqual(summary.scoreChange, {
      status: 'ready',
      current: 80,
      previous: 76,
      change: 4,
    });
    assert.deepEqual(summary.activity, {
      status: 'ready',
      current: 82,
      previous: 82,
      change: 0,
    });
    assert.equal(summary.sleep.status, 'limitation');
    assert.equal(summary.sleep.message, 'Ingen data');
  });

  it('still compares two real measurements when a profile_update sits between them', () => {
    const first = measurement({
      id: 'm1',
      measuredAt: '2026-09-21',
      createdAt: '2026-09-21T08:00:00.000Z',
      weightKg: 76,
      waistCm: 88,
    });
    const second = measurement({
      id: 'm2',
      measuredAt: '2026-09-23',
      createdAt: '2026-09-23T08:00:00.000Z',
      weightKg: 74,
      waistCm: 87,
    });
    const afterFirst = snapshot({
      id: 'profile-mid',
      createdAt: '2026-09-22T12:00:00.000Z',
      snapshotReason: 'profile_update',
      overallScore: 70,
      weightKg: 76,
      waistCm: 88,
      activityScore: 68,
    });
    const latestMeasurementSnap = snapshot({
      id: 'snap-m2',
      createdAt: '2026-09-23T08:00:00.000Z',
      snapshotReason: 'measurement',
      overallScore: 73,
      weightKg: 74,
      waistCm: 87,
      activityScore: 68,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: latestMeasurementSnap,
      previous: afterFirst,
      measurementsNewestFirst: [second, first],
      activitySnapshotsNewestFirst: [latestMeasurementSnap, afterFirst],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.deepEqual(summary.waist, {
      status: 'ready',
      current: 87,
      previous: 88,
      change: -1,
    });
    assert.deepEqual(summary.weight, {
      status: 'ready',
      current: 74,
      previous: 76,
      change: -2,
    });
  });

  it('never treats Build 5 Fix 1 carried profile_update values as a new weigh-in or waist event', () => {
    const onlyReal = measurement({
      id: 'm-real',
      measuredAt: '2026-09-23',
      createdAt: '2026-09-23T08:00:00.000Z',
      weightKg: 74,
      waistCm: 87,
    });
    const measurementSnap = snapshot({
      id: 'snap-m',
      createdAt: '2026-09-23T08:00:00.000Z',
      snapshotReason: 'measurement',
      overallScore: 70,
      weightKg: 74,
      waistCm: 87,
      activityScore: 82,
    });
    const carried = snapshot({
      id: 'snap-carry',
      createdAt: '2026-09-23T11:00:00.000Z',
      snapshotReason: 'profile_update',
      overallScore: 72,
      weightKg: 74,
      waistCm: 87,
      activityScore: 82,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: carried,
      previous: measurementSnap,
      measurementsNewestFirst: [onlyReal],
      activitySnapshotsNewestFirst: [carried, measurementSnap],
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }

    assert.deepEqual(summary.weight, {
      status: 'insufficient_history',
      current: 74,
    });
    assert.deepEqual(summary.waist, {
      status: 'insufficient_history',
      current: 87,
    });
    assert.deepEqual(summary.scoreChange, {
      status: 'ready',
      current: 72,
      previous: 70,
      change: 2,
    });
  });

  it('derives the latest distinct activity transition and ignores repeated scores', () => {
    const scores = [50, 68, 68, 82, 82];
    const snapshots = scores.map((activityScore, index) =>
      snapshot({
        id: `act-${index}`,
        createdAt: `2026-09-0${index + 1}T10:00:00.000Z`,
        activityScore,
        overallScore: 70 + index,
      }),
    );
    const newestFirst = [...snapshots].reverse();

    assert.deepEqual(buildActivityLevelDelta(newestFirst), {
      status: 'ready',
      current: 82,
      previous: 68,
      change: 14,
    });

    const summary = buildDevelopmentHomeSummary({
      latest: newestFirst[0]!,
      previous: newestFirst[1]!,
      activitySnapshotsNewestFirst: newestFirst,
    });
    assert.equal(summary.status, 'ready');
    if (summary.status !== 'ready') {
      return;
    }
    assert.deepEqual(summary.activity, {
      status: 'ready',
      current: 82,
      previous: 68,
      change: 14,
    });
    assert.deepEqual(summary.scoreChange, {
      status: 'ready',
      current: 74,
      previous: 73,
      change: 1,
    });
  });

  it('treats a single distinct activity level as unchanged rather than a self-transition', () => {
    const snapshots = [82, 82, 82].map((activityScore, index) =>
      snapshot({
        id: `same-${index}`,
        createdAt: `2026-09-2${index}T10:00:00.000Z`,
        activityScore,
        overallScore: 80 + index,
      }),
    );
    const newestFirst = [...snapshots].reverse();

    assert.deepEqual(buildActivityLevelDelta(newestFirst), {
      status: 'ready',
      current: 82,
      previous: 82,
      change: 0,
    });
  });
});

describe('resolveDevelopmentPeriodSince', () => {
  it('filters period windows for 7d / 30d / 90d / 1y', () => {
    const now = new Date('2026-08-08T12:00:00.000Z');

    assert.equal(resolveDevelopmentPeriodSince('7d', now), '2026-08-01T12:00:00.000Z');
    assert.equal(resolveDevelopmentPeriodSince('30d', now), '2026-07-09T12:00:00.000Z');
    assert.equal(resolveDevelopmentPeriodSince('90d', now), '2026-05-10T12:00:00.000Z');
    assert.equal(resolveDevelopmentPeriodSince('1y', now), '2025-08-08T12:00:00.000Z');
  });
});

describe('buildDevelopmentTrendsSummary', () => {
  it('marks insufficient history when fewer than 2 points', () => {
    const only = snapshot({
      id: 's1',
      createdAt: '2026-08-07T10:00:00.000Z',
      overallScore: 70,
    });

    const summary = buildDevelopmentTrendsSummary({
      period: '7d',
      periodSince: '2026-08-01T12:00:00.000Z',
      periodSnapshotsAscending: [only],
      absoluteLatest: only,
    });

    assert.equal(summary.hasSufficientHistory, false);
    assert.equal(summary.periodChange, null);
    assert.equal(summary.currentScore, 70);
    assert.equal(summary.series.healthScore.length, 1);
  });

  it('builds ascending metric series including activity_score', () => {
    const a = snapshot({
      id: 'a',
      createdAt: '2026-08-01T10:00:00.000Z',
      overallScore: 60,
      weightKg: 84,
      waistCm: 95,
      neckCm: 40,
      activityScore: 40,
    });
    const b = snapshot({
      id: 'b',
      createdAt: '2026-08-05T10:00:00.000Z',
      overallScore: 65,
      weightKg: 82,
      waistCm: 93,
      neckCm: 39,
      activityScore: 50,
    });
    const c = snapshot({
      id: 'c',
      createdAt: '2026-08-08T10:00:00.000Z',
      overallScore: 70,
      weightKg: 80,
      waistCm: 90,
      neckCm: 38,
      activityScore: 60,
    });

    const ascending = [a, b, c];
    const series = buildDevelopmentMetricSeries(ascending);

    assert.equal(assertSeriesAscending(series.healthScore), true);
    assert.equal(assertSeriesAscending(series.weight), true);
    assert.equal(assertSeriesAscending(series.waist), true);
    assert.equal(assertSeriesAscending(series.neck), true);
    assert.equal(assertSeriesAscending(series.activity), true);

    assert.deepEqual(
      series.activity.map((p) => p.value),
      [40, 50, 60],
    );
    assert.deepEqual(
      series.healthScore.map((p) => p.value),
      [60, 65, 70],
    );

    const summary = buildDevelopmentTrendsSummary({
      period: '30d',
      periodSince: '2026-07-09T12:00:00.000Z',
      periodSnapshotsAscending: ascending,
      absoluteLatest: c,
    });

    assert.equal(summary.hasSufficientHistory, true);
    assert.equal(summary.periodChange, 10);
    assert.equal(summary.currentScore, 70);
  });

  it('treats same-day snapshots minutes apart as sufficient trend history', () => {
    const morning = snapshot({
      id: 'same-day-1',
      createdAt: '2026-08-16T10:00:00.000Z',
      overallScore: 70,
    });
    const noon = snapshot({
      id: 'same-day-2',
      createdAt: '2026-08-16T10:03:00.000Z',
      overallScore: 71,
    });
    const afternoon = snapshot({
      id: 'same-day-3',
      createdAt: '2026-08-16T10:05:00.000Z',
      overallScore: 72,
    });

    const summary = buildDevelopmentTrendsSummary({
      period: '7d',
      periodSince: '2026-08-09T12:00:00.000Z',
      periodSnapshotsAscending: [morning, noon, afternoon],
      absoluteLatest: afternoon,
    });

    assert.equal(summary.hasSufficientHistory, true);
    assert.equal(summary.periodChange, 2);
    assert.equal(summary.series.healthScore.length, 3);
  });

  it('uses only period-scoped points for series (period filtering)', () => {
    const inPeriod = [
      snapshot({
        id: 'old-in',
        createdAt: '2026-08-02T10:00:00.000Z',
        overallScore: 62,
      }),
      snapshot({
        id: 'new-in',
        createdAt: '2026-08-07T10:00:00.000Z',
        overallScore: 71,
      }),
    ];

    const summary = buildDevelopmentTrendsSummary({
      period: '7d',
      periodSince: '2026-08-01T12:00:00.000Z',
      periodSnapshotsAscending: inPeriod,
      absoluteLatest: inPeriod[1]!,
    });

    assert.equal(summary.series.healthScore.length, 2);
    assert.equal(summary.periodChange, 9);
    assert.equal(summary.series.healthScore[0]!.capturedAt, '2026-08-02T10:00:00.000Z');
    assert.equal(summary.series.healthScore[1]!.capturedAt, '2026-08-07T10:00:00.000Z');
  });

  it('omits imputed onboarding waist and neck from circumference trend series', () => {
    const onboarding = snapshot({
      id: 'onboarding',
      createdAt: '2026-08-01T10:00:00.000Z',
      snapshotReason: 'onboarding',
      overallScore: 68,
      weightKg: 82,
      waistCm: 85,
      neckCm: 36,
      activityScore: 48,
    });
    const measured = snapshot({
      id: 'measured',
      createdAt: '2026-08-10T10:00:00.000Z',
      snapshotReason: 'measurement',
      overallScore: 71,
      weightKg: 80,
      waistCm: 90,
      neckCm: 38,
      activityScore: 52,
    });

    const series = buildDevelopmentMetricSeries([onboarding, measured]);

    assert.deepEqual(
      series.waist.map((point) => point.value),
      [90],
    );
    assert.deepEqual(
      series.neck.map((point) => point.value),
      [38],
    );
    assert.deepEqual(
      series.weight.map((point) => point.value),
      [82, 80],
    );
    assert.deepEqual(
      series.healthScore.map((point) => point.value),
      [68, 71],
    );
    assert.deepEqual(
      series.activity.map((point) => point.value),
      [48, 52],
    );
  });
});
