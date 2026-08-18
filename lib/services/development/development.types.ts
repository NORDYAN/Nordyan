import type { ProgressTrend } from '@/lib/domain/progress';

export const DEVELOPMENT_SLEEP_LIMITATION_MESSAGE = 'Ingen data' as const;

export type DevelopmentPeriod = '7d' | '30d' | '90d' | '1y';

export type DevelopmentTrendMetric =
  | 'health_score'
  | 'weight'
  | 'waist'
  | 'neck'
  | 'activity';

export type DevelopmentCoachPresentation = {
  available: boolean;
  title: string | null;
  message: string | null;
  recommendationId: string | null;
  durationMinutes?: number | null;
  frequencyPerWeek?: number | null;
};

export type DevelopmentNumericDelta =
  | {
      status: 'ready';
      current: number;
      previous: number;
      change: number;
    }
  | {
      status: 'insufficient_history';
      current: number | null;
    };

export type DevelopmentSleepDriver = {
  status: 'limitation';
  message: typeof DEVELOPMENT_SLEEP_LIMITATION_MESSAGE;
};

export type DevelopmentHomeSummary =
  | { status: 'empty' }
  | {
      status: 'ready';
      latestSnapshotId: string;
      latestCapturedAt: string;
      currentScore: number;
      scoreChange: DevelopmentNumericDelta;
      trend: ProgressTrend;
      weight: DevelopmentNumericDelta;
      waist: DevelopmentNumericDelta;
      activity: DevelopmentNumericDelta;
      sleep: DevelopmentSleepDriver;
      coach: DevelopmentCoachPresentation;
    };

export type DevelopmentTrendPoint = {
  capturedAt: string;
  value: number;
};

export type DevelopmentMetricSeries = {
  healthScore: DevelopmentTrendPoint[];
  weight: DevelopmentTrendPoint[];
  waist: DevelopmentTrendPoint[];
  neck: DevelopmentTrendPoint[];
  /** Health Score activity driver (`activity_score`), not device steps. */
  activity: DevelopmentTrendPoint[];
};

export type DevelopmentTrendsSummary = {
  period: DevelopmentPeriod;
  periodSince: string;
  /** Absolute latest score when any snapshot exists; otherwise null. */
  currentScore: number | null;
  /**
   * Change within the selected period (last − first chronologically).
   * Null when fewer than 2 points exist in the period.
   */
  periodChange: number | null;
  hasSufficientHistory: boolean;
  series: DevelopmentMetricSeries;
  coach: DevelopmentCoachPresentation;
};
