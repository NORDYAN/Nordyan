import { routes } from '@/constants/routes';
import {
  formatDecimal,
  formatDisplayDate,
  getActiveLocale,
  getHealthScoreBandDisplayLabel,
  getLocalizedCoachPresentation,
  liveArray,
  t,
} from '@/lib/i18n';
import {
  ACTIVITY_TREND_LEVEL_DOMAIN,
  formatDevelopmentActivityLevelLabel,
  formatDevelopmentActivityTrendLabel,
  resolveActivityLevelFromStoredScore,
  resolveActivityTrendPlotLevel,
} from './development-activity-level';
import type { DevelopmentTrendChartValueDomain } from './development-trend-chart.layout';
import { formatCoachMessage } from '@/lib/services/coach/coach.presentation';
import type {
  DevelopmentCoachPresentation,
  DevelopmentHomeSummary,
  DevelopmentNumericDelta,
  DevelopmentPeriod,
  DevelopmentTrendMetric,
  DevelopmentTrendPoint,
  DevelopmentTrendsSummary,
} from '@/lib/services/development';

import type {
  DevelopmentChartPointView,
  DevelopmentCoachView,
  DevelopmentDriverRow,
  DevelopmentHomeFetchState,
  DevelopmentHomeViewModel,
  DevelopmentMetricOption,
  DevelopmentPeriodChangeView,
  DevelopmentPeriodOption,
  DevelopmentScoreChangeView,
  DevelopmentSemanticTone,
  DevelopmentTrendsFetchState,
  DevelopmentTrendsViewModel,
} from './development.types';

export function getDevelopmentHomeEmptyMessage(): string {
  return t('development.home.empty');
}

export function getDevelopmentHomeErrorMessage(): string {
  return t('development.home.error');
}

export function getDevelopmentTrendsEmptyMessage(): string {
  return t('development.trends.empty');
}

export function getDevelopmentTrendsErrorMessage(): string {
  return t('development.trends.error');
}

export function getDevelopmentFactorsCtaLabel(): string {
  return t('development.factorsCta');
}

export const DEVELOPMENT_FACTORS_CTA_LABEL = getDevelopmentFactorsCtaLabel;

export const DEVELOPMENT_FACTORS_CTA_ROUTE = routes.healthScore;

export function getDevelopmentHomeInsufficientMessage(): string {
  return t('development.home.insufficient');
}

export const DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE = routes.healthNewMeasurement;

function getDevelopmentInsufficientHistoryText(): string {
  return t('development.insufficientHistory');
}

function getDevelopmentChartInsufficientMessage(): string {
  return t('development.chartInsufficient');
}

function buildDevelopmentPeriodOptions(): DevelopmentPeriodOption[] {
  return [
    { id: '7d', label: t('development.period.7d') },
    { id: '30d', label: t('development.period.30d') },
    { id: '90d', label: t('development.period.90d') },
    { id: '1y', label: t('development.period.1y') },
  ];
}

function buildDevelopmentMetricOptions(): DevelopmentMetricOption[] {
  return [
    { id: 'health_score', label: t('development.metric.healthScore') },
    { id: 'weight', label: t('development.metric.weight') },
    { id: 'waist', label: t('development.metric.waist') },
    { id: 'neck', label: t('development.metric.neck') },
    { id: 'activity', label: t('development.metric.activity') },
  ];
}

export const DEVELOPMENT_PERIOD_OPTIONS: readonly DevelopmentPeriodOption[] = liveArray(
  buildDevelopmentPeriodOptions,
);

export const DEVELOPMENT_METRIC_OPTIONS: readonly DevelopmentMetricOption[] = liveArray(
  buildDevelopmentMetricOptions,
);

function formatWeightKg(weightKg: number): string {
  return t('common.kg', { value: formatDecimal(weightKg) });
}

function formatCircumferenceCm(valueCm: number): string {
  return t('common.cm', { value: String(Math.round(valueCm)) });
}

function formatActivityTransition(delta: Extract<DevelopmentNumericDelta, { status: 'ready' }>): string {
  const fromLevel = resolveActivityLevelFromStoredScore(delta.previous);
  const toLevel = resolveActivityLevelFromStoredScore(delta.current);
  if (!fromLevel || !toLevel) {
    return getDevelopmentInsufficientHistoryText();
  }

  if (fromLevel === toLevel) {
    return t('development.driver.activity.unchanged');
  }

  return t('development.driver.activity.transition', {
    from: formatDevelopmentActivityLevelLabel(fromLevel),
    to: formatDevelopmentActivityLevelLabel(toLevel),
  });
}

function formatWeightChange(change: number): string {
  const rounded = Math.round(change * 10) / 10;
  if (rounded === 0) {
    return t('development.driver.weight.unchanged');
  }

  return `${formatSignedNumber(change, 1)} kg`;
}

function formatSignedNumber(change: number, digits = 0): string {
  const rounded =
    digits === 0
      ? Math.round(change)
      : Math.round(change * 10 ** digits) / 10 ** digits;
  const absolute =
    digits === 0
      ? String(Math.abs(rounded))
      : formatDecimal(Math.abs(rounded), undefined, digits);

  if (rounded > 0) {
    return `+${absolute}`;
  }
  if (rounded < 0) {
    return `−${absolute}`;
  }
  return absolute;
}

function compositionDriverTone(change: number): Exclude<DevelopmentSemanticTone, 'limitation'> {
  if (change < 0) {
    return 'positive';
  }
  if (change > 0) {
    return 'negative';
  }
  return 'neutral';
}

function activityDriverTone(change: number): Exclude<DevelopmentSemanticTone, 'limitation'> {
  if (change > 0) {
    return 'positive';
  }
  if (change < 0) {
    return 'negative';
  }
  return 'neutral';
}

function formatScoreChangeText(change: number): DevelopmentScoreChangeView {
  if (change > 0) {
    return {
      status: 'ready',
      direction: 'up',
      tone: 'positive',
      text: t('development.score.up', { change }),
    };
  }

  if (change < 0) {
    return {
      status: 'ready',
      direction: 'down',
      tone: 'negative',
      text: t('development.score.down', { change }),
    };
  }

  return {
    status: 'ready',
    direction: 'stable',
    tone: 'neutral',
    text: t('development.score.stable'),
  };
}

export function formatDevelopmentScoreChange(
  delta: DevelopmentNumericDelta,
): DevelopmentScoreChangeView {
  if (delta.status === 'insufficient_history') {
    return {
      status: 'insufficient_history',
      tone: 'neutral',
      text: getDevelopmentInsufficientHistoryText(),
    };
  }

  return formatScoreChangeText(delta.change);
}

function formatPeriodChangeText(change: number): DevelopmentPeriodChangeView {
  if (change > 0) {
    return {
      status: 'ready',
      direction: 'up',
      tone: 'positive',
      text: t('development.periodChange.up', { change }),
    };
  }

  if (change < 0) {
    return {
      status: 'ready',
      direction: 'down',
      tone: 'negative',
      text: t('development.periodChange.down', { change }),
    };
  }

  return {
    status: 'ready',
    direction: 'stable',
    tone: 'neutral',
    text: t('development.periodChange.stable'),
  };
}

export function formatDevelopmentPeriodChange(
  periodChange: number | null,
  hasSufficientHistory: boolean,
): DevelopmentPeriodChangeView {
  if (!hasSufficientHistory || periodChange == null) {
    return {
      status: 'insufficient_history',
      tone: 'neutral',
      text: getDevelopmentInsufficientHistoryText(),
    };
  }

  return formatPeriodChangeText(periodChange);
}

function mapCoach(coach: DevelopmentCoachPresentation): DevelopmentCoachView {
  if (!coach.available || !coach.recommendationId) {
    return { available: false, title: null, body: null };
  }

  if (
    coach.durationMinutes != null &&
    coach.frequencyPerWeek != null &&
    coach.durationMinutes > 0 &&
    coach.frequencyPerWeek > 0
  ) {
    const display = getLocalizedCoachPresentation(
      coach.recommendationId,
      coach.durationMinutes,
      coach.frequencyPerWeek,
    );
    return {
      available: true,
      title: display.title,
      body: formatCoachMessage(display.description),
    };
  }

  if (!coach.title || !coach.message) {
    return { available: false, title: null, body: null };
  }

  return {
    available: true,
    title: coach.title,
    body: coach.message,
  };
}

function mapNumericDriver(input: {
  id: 'waist' | 'weight' | 'activity';
  label: string;
  delta: DevelopmentNumericDelta;
  formatValue: (value: number) => string;
  formatChange: (change: number) => string;
}): DevelopmentDriverRow {
  const { id, label, delta, formatValue, formatChange } = input;

  if (delta.status === 'insufficient_history') {
    return {
      id,
      label,
      valueText: delta.current == null ? '—' : formatValue(delta.current),
      changeText: getDevelopmentInsufficientHistoryText(),
      state: 'insufficient_history',
      tone: 'neutral',
    };
  }

  return {
    id,
    label,
    valueText: formatValue(delta.current),
    changeText: formatChange(delta.change),
    state: 'ready',
    tone: compositionDriverTone(delta.change),
  };
}

function mapActivityDriver(delta: DevelopmentNumericDelta): DevelopmentDriverRow {
  const label = t('development.driver.activity');

  if (delta.status === 'insufficient_history') {
    const mapped = delta.current == null ? null : resolveActivityLevelFromStoredScore(delta.current);
    return {
      id: 'activity',
      label,
      valueText: mapped ? formatDevelopmentActivityLevelLabel(mapped) : '—',
      changeText: getDevelopmentInsufficientHistoryText(),
      state: 'insufficient_history',
      tone: 'neutral',
    };
  }

  const fromLevel = resolveActivityLevelFromStoredScore(delta.previous);
  const toLevel = resolveActivityLevelFromStoredScore(delta.current);
  if (!fromLevel || !toLevel) {
    return {
      id: 'activity',
      label,
      valueText: toLevel ? formatDevelopmentActivityLevelLabel(toLevel) : '—',
      changeText: getDevelopmentInsufficientHistoryText(),
      state: 'insufficient_history',
      tone: 'neutral',
    };
  }

  return {
    id: 'activity',
    label,
    valueText: formatDevelopmentActivityLevelLabel(toLevel),
    changeText: formatActivityTransition(delta),
    state: 'ready',
    tone: activityDriverTone(delta.change),
  };
}

export function buildDevelopmentDriverRows(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
): DevelopmentDriverRow[] {
  return [
    mapNumericDriver({
      id: 'waist',
      label: t('development.driver.waist'),
      delta: summary.waist,
      formatValue: formatCircumferenceCm,
      formatChange: (change) => `${formatSignedNumber(change)} cm`,
    }),
    mapNumericDriver({
      id: 'weight',
      label: t('development.driver.weight'),
      delta: summary.weight,
      formatValue: formatWeightKg,
      formatChange: formatWeightChange,
    }),
    mapActivityDriver(summary.activity),
    {
      id: 'sleep',
      label: t('development.driver.sleep'),
      valueText: t('explained.sleep.status'),
      changeText: null,
      state: 'limitation',
      tone: 'limitation',
    },
  ];
}

export function buildDevelopmentHomeViewModel(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
): DevelopmentHomeViewModel {
  const historyStatus =
    summary.trend === 'insufficient_history' ||
    summary.scoreChange.status === 'insufficient_history'
      ? 'insufficient_history'
      : 'comparable';

  return {
    currentScore: summary.currentScore,
    scoreBandLabel: getHealthScoreBandDisplayLabel(summary.currentScore),
    scoreChange: formatDevelopmentScoreChange(summary.scoreChange),
    historyStatus,
    drivers: buildDevelopmentDriverRows(summary),
    coach: mapCoach(summary.coach),
  };
}

export function mapDevelopmentHomeSummaryToFetchState(
  summary: DevelopmentHomeSummary,
): Exclude<DevelopmentHomeFetchState, { status: 'loading' | 'error' }> {
  if (summary.status === 'empty') {
    return { status: 'empty', message: getDevelopmentHomeEmptyMessage() };
  }

  const model = buildDevelopmentHomeViewModel(summary);
  if (model.historyStatus === 'insufficient_history') {
    return { status: 'insufficient_history', model };
  }

  return { status: 'ready', model };
}

export function getDevelopmentPeriodLabel(period: DevelopmentPeriod): string {
  return t(`development.period.${period}`);
}

export function formatDevelopmentChartDateLabel(capturedAt: string): string {
  const date = new Date(capturedAt);
  if (Number.isNaN(date.getTime())) {
    return capturedAt;
  }

  return formatDisplayDate(date, getActiveLocale(), {
    day: 'numeric',
    month: 'short',
  });
}

function formatMetricValueLabel(
  metric: DevelopmentTrendMetric,
  value: number,
): string {
  switch (metric) {
    case 'weight':
      return formatWeightKg(value);
    case 'waist':
    case 'neck':
      return formatCircumferenceCm(value);
    case 'activity':
      return formatDevelopmentActivityTrendLabel(value);
    case 'health_score':
    default:
      return String(Math.round(value));
  }
}

function seriesForMetric(
  summary: DevelopmentTrendsSummary,
  metric: DevelopmentTrendMetric,
): DevelopmentTrendPoint[] {
  switch (metric) {
    case 'weight':
      return summary.series.weight;
    case 'waist':
      return summary.series.waist;
    case 'neck':
      return summary.series.neck;
    case 'activity':
      return summary.series.activity;
    case 'health_score':
    default:
      return summary.series.healthScore;
  }
}

export function resolveDevelopmentTrendChartDomain(
  metric: DevelopmentTrendMetric,
): DevelopmentTrendChartValueDomain | null {
  if (metric === 'activity') {
    return { ...ACTIVITY_TREND_LEVEL_DOMAIN };
  }

  return null;
}

export function buildDevelopmentChartPoints(
  summary: DevelopmentTrendsSummary,
  metric: DevelopmentTrendMetric,
): DevelopmentChartPointView[] {
  return seriesForMetric(summary, metric).map((point) => ({
    capturedAt: point.capturedAt,
    value:
      metric === 'activity'
        ? (resolveActivityTrendPlotLevel(point.value) ?? Number.NaN)
        : point.value,
    valueLabel: formatMetricValueLabel(metric, point.value),
    dateLabel: formatDevelopmentChartDateLabel(point.capturedAt),
  }));
}

export function buildDevelopmentTrendsViewModel(
  summary: DevelopmentTrendsSummary,
  selectedMetric: DevelopmentTrendMetric,
): DevelopmentTrendsViewModel {
  const hasSufficientHistory = summary.hasSufficientHistory;

  return {
    currentScore: summary.currentScore,
    scoreBandLabel:
      summary.currentScore == null
        ? null
        : getHealthScoreBandDisplayLabel(summary.currentScore),
    period: summary.period,
    periodLabel: getDevelopmentPeriodLabel(summary.period),
    periodOptions: DEVELOPMENT_PERIOD_OPTIONS,
    periodChange: formatDevelopmentPeriodChange(
      summary.periodChange,
      hasSufficientHistory,
    ),
    selectedMetric,
    metricOptions: DEVELOPMENT_METRIC_OPTIONS,
    hasSufficientHistory,
    chartPoints: buildDevelopmentChartPoints(summary, selectedMetric),
    chartValueDomain: resolveDevelopmentTrendChartDomain(selectedMetric),
    chartEmptyMessage: hasSufficientHistory
      ? null
      : getDevelopmentChartInsufficientMessage(),
    coach: mapCoach(summary.coach),
  };
}

export function mapDevelopmentTrendsSummaryToFetchState(
  summary: DevelopmentTrendsSummary,
  selectedMetric: DevelopmentTrendMetric,
): Exclude<DevelopmentTrendsFetchState, { status: 'loading' | 'error' }> {
  if (summary.currentScore == null && summary.series.healthScore.length === 0) {
    return { status: 'empty', message: getDevelopmentTrendsEmptyMessage() };
  }

  const model = buildDevelopmentTrendsViewModel(summary, selectedMetric);
  if (!model.hasSufficientHistory) {
    return { status: 'insufficient_history', model };
  }

  return { status: 'ready', model };
}
