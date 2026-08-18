import type {
  DevelopmentPeriod,
  DevelopmentTrendMetric,
} from '@/lib/services/development';

export type DevelopmentDriverId = 'waist' | 'weight' | 'activity' | 'sleep';

export type DevelopmentDriverRowState =
  | 'ready'
  | 'insufficient_history'
  | 'limitation';

export type DevelopmentDriverRow = {
  id: DevelopmentDriverId;
  label: string;
  valueText: string;
  changeText: string | null;
  state: DevelopmentDriverRowState;
};

export type DevelopmentScoreChangeView =
  | {
      status: 'ready';
      direction: 'up' | 'down' | 'stable';
      text: string;
    }
  | {
      status: 'insufficient_history';
      text: string;
    };

export type DevelopmentCoachView =
  | {
      available: true;
      title: string;
      body: string;
    }
  | {
      available: false;
      title: null;
      body: null;
    };

export type DevelopmentHomeViewModel = {
  currentScore: number;
  scoreBandLabel: string;
  scoreChange: DevelopmentScoreChangeView;
  historyStatus: 'comparable' | 'insufficient_history';
  drivers: DevelopmentDriverRow[];
  coach: DevelopmentCoachView;
};

export type DevelopmentHomeFetchState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; model: DevelopmentHomeViewModel }
  | { status: 'insufficient_history'; model: DevelopmentHomeViewModel };

export type DevelopmentPeriodOption = {
  id: DevelopmentPeriod;
  label: string;
};

export type DevelopmentMetricOption = {
  id: DevelopmentTrendMetric;
  label: string;
};

export type DevelopmentPeriodChangeView =
  | {
      status: 'ready';
      direction: 'up' | 'down' | 'stable';
      text: string;
    }
  | {
      status: 'insufficient_history';
      text: string;
    };

export type DevelopmentChartPointView = {
  capturedAt: string;
  value: number;
  valueLabel: string;
  dateLabel: string;
};

export type DevelopmentTrendsViewModel = {
  currentScore: number | null;
  scoreBandLabel: string | null;
  period: DevelopmentPeriod;
  periodLabel: string;
  periodOptions: readonly DevelopmentPeriodOption[];
  periodChange: DevelopmentPeriodChangeView;
  selectedMetric: DevelopmentTrendMetric;
  metricOptions: readonly DevelopmentMetricOption[];
  hasSufficientHistory: boolean;
  chartPoints: DevelopmentChartPointView[];
  chartEmptyMessage: string | null;
  coach: DevelopmentCoachView;
};

export type DevelopmentTrendsFetchState =
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; model: DevelopmentTrendsViewModel }
  | { status: 'insufficient_history'; model: DevelopmentTrendsViewModel };
