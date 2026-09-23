import { ACTIVITY_SCORES } from '@/lib/domain/health-score/health-score.constants';
import type { Measurement } from '@/lib/domain/measurement';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { ProgressTrend } from '@/lib/domain/progress';
import { formatCoachMessage, getCoachPresentation } from '@/lib/services/coach';

import {
  DEVELOPMENT_SLEEP_LIMITATION_MESSAGE,
  type DevelopmentCoachPresentation,
  type DevelopmentHomeSummary,
  type DevelopmentMetricSeries,
  type DevelopmentNumericDelta,
  type DevelopmentPeriod,
  type DevelopmentTrendPoint,
  type DevelopmentTrendsSummary,
} from './development.types';

const PERIOD_DAYS: Record<DevelopmentPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};

export function resolveDevelopmentPeriodSince(
  period: DevelopmentPeriod,
  now: Date = new Date(),
): string {
  const days = PERIOD_DAYS[period];
  const since = new Date(now.getTime());
  since.setUTCDate(since.getUTCDate() - days);
  return since.toISOString();
}

export function buildDevelopmentCoachPresentation(
  snapshot: HealthSnapshot | null,
): DevelopmentCoachPresentation {
  if (!snapshot) {
    return {
      available: false,
      title: null,
      message: null,
      recommendationId: null,
    };
  }

  const { coachRecommendationId, coachDurationMinutes, coachFrequencyPerWeek } = snapshot;

  if (
    !coachRecommendationId.trim() ||
    coachDurationMinutes == null ||
    coachFrequencyPerWeek == null ||
    coachDurationMinutes <= 0 ||
    coachFrequencyPerWeek <= 0
  ) {
    return {
      available: false,
      title: null,
      message: null,
      recommendationId: coachRecommendationId.trim() ? coachRecommendationId : null,
    };
  }

  const presentation = getCoachPresentation(
    coachRecommendationId,
    coachDurationMinutes,
    coachFrequencyPerWeek,
  );

  return {
    available: true,
    title: presentation.title,
    message: formatCoachMessage(presentation.description),
    recommendationId: coachRecommendationId,
    durationMinutes: coachDurationMinutes,
    frequencyPerWeek: coachFrequencyPerWeek,
  };
}

function buildDelta(current: number, previous: number): DevelopmentNumericDelta {
  return {
    status: 'ready',
    current,
    previous,
    change: current - previous,
  };
}

function insufficientDelta(current: number | null): DevelopmentNumericDelta {
  return { status: 'insufficient_history', current };
}

function resolveFrozenActivityScore(score: number): number | null {
  const rounded = Math.round(score);
  for (const frozen of Object.values(ACTIVITY_SCORES)) {
    if (frozen === rounded) {
      return frozen;
    }
  }

  return null;
}

/** Latest two real measurement events. Caller must pass newest-first (measured_at, created_at). */
export function buildMeasurementDriverDelta(
  measurementsNewestFirst: readonly Measurement[],
  read: (measurement: Measurement) => number,
): DevelopmentNumericDelta {
  const latest = measurementsNewestFirst[0] ?? null;
  const previous = measurementsNewestFirst[1] ?? null;
  if (!latest || !previous) {
    return insufficientDelta(latest ? read(latest) : null);
  }

  return buildDelta(read(latest), read(previous));
}

/**
 * Latest meaningful distinct ACTIVITY_SCORES transition.
 * Repeated identical scores (measurements / profile_update carry) are ignored.
 */
export function buildActivityLevelDelta(
  snapshotsNewestFirst: readonly HealthSnapshot[],
): DevelopmentNumericDelta {
  const distinctAscending: number[] = [];

  for (let index = snapshotsNewestFirst.length - 1; index >= 0; index -= 1) {
    const mapped = resolveFrozenActivityScore(snapshotsNewestFirst[index]!.activityScore);
    if (mapped == null) {
      continue;
    }

    if (distinctAscending[distinctAscending.length - 1] !== mapped) {
      distinctAscending.push(mapped);
    }
  }

  if (distinctAscending.length === 0) {
    const latestScore = snapshotsNewestFirst[0]?.activityScore ?? null;
    return insufficientDelta(latestScore);
  }

  const current = distinctAscending[distinctAscending.length - 1]!;
  if (distinctAscending.length === 1) {
    return buildDelta(current, current);
  }

  return buildDelta(current, distinctAscending[distinctAscending.length - 2]!);
}

/** Circumference values on non-measurement snapshots may be imputed for scoring. */
export function isObservedCircumferenceSnapshot(snapshot: HealthSnapshot): boolean {
  return snapshot.snapshotReason === 'measurement';
}

export function buildObservedCircumferenceDelta(
  latest: HealthSnapshot,
  previous: HealthSnapshot | null,
  read: (snapshot: HealthSnapshot) => number,
): DevelopmentNumericDelta {
  const current = isObservedCircumferenceSnapshot(latest) ? read(latest) : null;

  if (
    current == null ||
    !previous ||
    !isObservedCircumferenceSnapshot(previous)
  ) {
    return insufficientDelta(current);
  }

  return buildDelta(current, read(previous));
}

function deriveTrend(scoreChange: number): Exclude<ProgressTrend, 'insufficient_history'> {
  if (scoreChange > 0) {
    return 'improving';
  }
  if (scoreChange < 0) {
    return 'declining';
  }
  return 'stable';
}

/**
 * Builds Development Home summary.
 * Overall score: newest two snapshots.
 * Weight/waist: newest two real measurements (not snapshot carry-forward).
 * Activity: latest distinct frozen activity_score transition.
 * Sleep is always the fixed limitation message (no sleep data in v1).
 */
export function buildDevelopmentHomeSummary(input: {
  latest: HealthSnapshot | null;
  previous: HealthSnapshot | null;
  measurementsNewestFirst?: readonly Measurement[];
  activitySnapshotsNewestFirst?: readonly HealthSnapshot[];
}): DevelopmentHomeSummary {
  const { latest, previous } = input;
  const measurements = input.measurementsNewestFirst ?? [];
  const activitySnapshots = input.activitySnapshotsNewestFirst ?? (latest ? [latest, previous].filter(Boolean) as HealthSnapshot[] : []);

  if (!latest) {
    return { status: 'empty' };
  }

  const sleep = {
    status: 'limitation' as const,
    message: DEVELOPMENT_SLEEP_LIMITATION_MESSAGE,
  };

  const weight = buildMeasurementDriverDelta(measurements, (item) => item.weightKg);
  const waist = buildMeasurementDriverDelta(measurements, (item) => item.waistCm);
  const activity = buildActivityLevelDelta(activitySnapshots);

  if (!previous) {
    return {
      status: 'ready',
      latestSnapshotId: latest.id,
      latestCapturedAt: latest.createdAt,
      currentScore: latest.overallScore,
      scoreChange: insufficientDelta(latest.overallScore),
      trend: 'insufficient_history',
      weight,
      waist,
      activity,
      sleep,
      coach: buildDevelopmentCoachPresentation(latest),
    };
  }

  const scoreDelta = latest.overallScore - previous.overallScore;

  return {
    status: 'ready',
    latestSnapshotId: latest.id,
    latestCapturedAt: latest.createdAt,
    currentScore: latest.overallScore,
    scoreChange: buildDelta(latest.overallScore, previous.overallScore),
    trend: deriveTrend(scoreDelta),
    weight,
    waist,
    activity,
    sleep,
    coach: buildDevelopmentCoachPresentation(latest),
  };
}

function toSeries(
  snapshots: HealthSnapshot[],
  read: (snapshot: HealthSnapshot) => number,
): DevelopmentTrendPoint[] {
  return snapshots.map((snapshot) => ({
    capturedAt: snapshot.createdAt,
    value: read(snapshot),
  }));
}

export function buildDevelopmentMetricSeries(
  periodSnapshotsAscending: HealthSnapshot[],
): DevelopmentMetricSeries {
  const observedCircumferences = periodSnapshotsAscending.filter(isObservedCircumferenceSnapshot);

  return {
    healthScore: toSeries(periodSnapshotsAscending, (s) => s.overallScore),
    weight: toSeries(periodSnapshotsAscending, (s) => s.weightKg),
    waist: toSeries(observedCircumferences, (s) => s.waistCm),
    neck: toSeries(observedCircumferences, (s) => s.neckCm),
    activity: toSeries(periodSnapshotsAscending, (s) => s.activityScore),
  };
}

export function buildDevelopmentTrendsSummary(input: {
  period: DevelopmentPeriod;
  periodSince: string;
  periodSnapshotsAscending: HealthSnapshot[];
  absoluteLatest: HealthSnapshot | null;
}): DevelopmentTrendsSummary {
  const { period, periodSince, periodSnapshotsAscending, absoluteLatest } = input;
  const series = buildDevelopmentMetricSeries(periodSnapshotsAscending);
  const hasSufficientHistory = periodSnapshotsAscending.length >= 2;

  let periodChange: number | null = null;
  if (hasSufficientHistory) {
    const first = periodSnapshotsAscending[0]!;
    const last = periodSnapshotsAscending[periodSnapshotsAscending.length - 1]!;
    periodChange = last.overallScore - first.overallScore;
  }

  return {
    period,
    periodSince,
    currentScore: absoluteLatest?.overallScore ?? null,
    periodChange,
    hasSufficientHistory,
    series,
    coach: buildDevelopmentCoachPresentation(absoluteLatest),
  };
}

/** Test helper: chronological ascending by createdAt. */
export function assertSeriesAscending(points: DevelopmentTrendPoint[]): boolean {
  for (let i = 1; i < points.length; i += 1) {
    if (points[i]!.capturedAt < points[i - 1]!.capturedAt) {
      return false;
    }
  }
  return true;
}
