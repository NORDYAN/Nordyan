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
 * Builds Development Home summary from latest + optional previous snapshot.
 * Sleep is always the fixed limitation message (no sleep data in v1).
 */
export function buildDevelopmentHomeSummary(input: {
  latest: HealthSnapshot | null;
  previous: HealthSnapshot | null;
}): DevelopmentHomeSummary {
  const { latest, previous } = input;

  if (!latest) {
    return { status: 'empty' };
  }

  const sleep = {
    status: 'limitation' as const,
    message: DEVELOPMENT_SLEEP_LIMITATION_MESSAGE,
  };

  if (!previous) {
    return {
      status: 'ready',
      latestSnapshotId: latest.id,
      latestCapturedAt: latest.createdAt,
      currentScore: latest.overallScore,
      scoreChange: insufficientDelta(latest.overallScore),
      trend: 'insufficient_history',
      weight: insufficientDelta(latest.weightKg),
      waist: insufficientDelta(latest.waistCm),
      activity: insufficientDelta(latest.activityScore),
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
    weight: buildDelta(latest.weightKg, previous.weightKg),
    waist: buildDelta(latest.waistCm, previous.waistCm),
    activity: buildDelta(latest.activityScore, previous.activityScore),
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
  return {
    healthScore: toSeries(periodSnapshotsAscending, (s) => s.overallScore),
    weight: toSeries(periodSnapshotsAscending, (s) => s.weightKg),
    waist: toSeries(periodSnapshotsAscending, (s) => s.waistCm),
    neck: toSeries(periodSnapshotsAscending, (s) => s.neckCm),
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
