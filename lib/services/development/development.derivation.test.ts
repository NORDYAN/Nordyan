import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { HealthSnapshot } from '../../domain/snapshot';

import {
  assertSeriesAscending,
  buildDevelopmentHomeSummary,
  buildDevelopmentMetricSeries,
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
      activityScore: 58,
    });

    const summary = buildDevelopmentHomeSummary({ latest, previous });
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
      current: 58,
      previous: 50,
      change: 8,
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
      activityScore: 52,
    });
    const latest = snapshot({
      id: 's-pm',
      createdAt: '2026-08-16T10:04:00.000Z',
      overallScore: 71,
      weightKg: 80.5,
      waistCm: 90.5,
      activityScore: 53,
    });

    const summary = buildDevelopmentHomeSummary({ latest, previous });
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
});
