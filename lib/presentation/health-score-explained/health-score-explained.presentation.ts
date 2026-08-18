import { getHealthScoreBandDisplayLabel } from '@/lib/i18n';
import type {
  DevelopmentHomeSummary,
  DevelopmentNumericDelta,
} from '@/lib/services/development';
import { formatDevelopmentScoreChange } from '@/lib/presentation/development';
import { t } from '@/lib/i18n';

import type {
  HealthScoreExplainedFactorCard,
  HealthScoreExplainedFetchState,
  HealthScoreExplainedViewModel,
} from './health-score-explained.types';

export function getHealthScoreExplainedEmptyMessage(): string {
  return t('explained.empty');
}

export function getHealthScoreExplainedErrorMessage(): string {
  return t('explained.error');
}

/** No methodology destination exists in v1. Do not render a dead learn-more CTA. */
export const HEALTH_SCORE_EXPLAINED_LEARN_MORE_DESTINATION = null;

function mapWaistFactor(delta: DevelopmentNumericDelta): HealthScoreExplainedFactorCard {
  if (delta.status === 'insufficient_history') {
    return {
      id: 'waist',
      label: t('explained.waist.label'),
      statusLabel: t('explained.status.insufficient'),
      body: t('explained.waist.insufficient'),
      tone: 'neutral',
    };
  }

  if (delta.change < 0) {
    return {
      id: 'waist',
      label: t('explained.waist.label'),
      statusLabel: t('explained.status.positive'),
      body: t('explained.waist.positive'),
      tone: 'positive',
    };
  }

  if (delta.change > 0) {
    return {
      id: 'waist',
      label: t('explained.waist.label'),
      statusLabel: t('explained.status.negative'),
      body: t('explained.waist.negative'),
      tone: 'negative',
    };
  }

  return {
    id: 'waist',
    label: t('explained.waist.label'),
    statusLabel: t('explained.status.stable'),
    body: t('explained.waist.stable'),
    tone: 'neutral',
  };
}

function mapActivityFactor(delta: DevelopmentNumericDelta): HealthScoreExplainedFactorCard {
  if (delta.status === 'insufficient_history') {
    return {
      id: 'activity',
      label: t('explained.activity.label'),
      statusLabel: t('explained.status.insufficient'),
      body: t('explained.activity.insufficient'),
      tone: 'neutral',
    };
  }

  if (delta.change > 0) {
    return {
      id: 'activity',
      label: t('explained.activity.label'),
      statusLabel: t('explained.status.positive'),
      body: t('explained.activity.positive'),
      tone: 'positive',
    };
  }

  if (delta.change < 0) {
    return {
      id: 'activity',
      label: t('explained.activity.label'),
      statusLabel: t('explained.status.negative'),
      body: t('explained.activity.negative'),
      tone: 'negative',
    };
  }

  return {
    id: 'activity',
    label: t('explained.activity.label'),
    statusLabel: t('explained.status.stable'),
    body: t('explained.activity.stable'),
    tone: 'neutral',
  };
}

function mapSleepFactor(): HealthScoreExplainedFactorCard {
  return {
    id: 'sleep',
    label: t('explained.sleep.label'),
    statusLabel: t('explained.sleep.status'),
    body: t('explained.sleep.body'),
    tone: 'limitation',
  };
}

function mapWeightFactor(delta: DevelopmentNumericDelta): HealthScoreExplainedFactorCard {
  if (delta.status === 'insufficient_history') {
    return {
      id: 'weight',
      label: t('explained.weight.label'),
      statusLabel: t('explained.status.insufficient'),
      body: t('explained.weight.insufficient'),
      tone: 'neutral',
    };
  }

  if (delta.change < 0) {
    return {
      id: 'weight',
      label: t('explained.weight.label'),
      statusLabel: t('explained.status.positive'),
      body: t('explained.weight.positive'),
      tone: 'positive',
    };
  }

  if (delta.change > 0) {
    return {
      id: 'weight',
      label: t('explained.weight.label'),
      statusLabel: t('explained.status.negative'),
      body: t('explained.weight.negative'),
      tone: 'negative',
    };
  }

  return {
    id: 'weight',
    label: t('explained.weight.label'),
    statusLabel: t('explained.status.stable'),
    body: t('explained.weight.stable'),
    tone: 'neutral',
  };
}

export function buildHealthScoreExplainedFactors(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
): HealthScoreExplainedFactorCard[] {
  return [
    mapWaistFactor(summary.waist),
    mapActivityFactor(summary.activity),
    mapSleepFactor(),
    mapWeightFactor(summary.weight),
  ];
}

export function buildHealthScoreExplainedViewModel(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
): HealthScoreExplainedViewModel {
  const scoreChange = formatDevelopmentScoreChange(summary.scoreChange);
  const historyStatus =
    summary.trend === 'insufficient_history' ||
    summary.scoreChange.status === 'insufficient_history'
      ? 'insufficient_history'
      : 'comparable';

  const coach =
    summary.coach.available && summary.coach.title && summary.coach.message
      ? {
          available: true as const,
          title: summary.coach.title,
          body: summary.coach.message,
        }
      : {
          available: false as const,
          title: null,
          body: null,
        };

  return {
    currentScore: summary.currentScore,
    scoreBandLabel: getHealthScoreBandDisplayLabel(summary.currentScore),
    scoreChange,
    historyStatus,
    factors: buildHealthScoreExplainedFactors(summary),
    coach,
  };
}

export function mapHealthScoreExplainedSummaryToFetchState(
  summary: DevelopmentHomeSummary,
): Exclude<HealthScoreExplainedFetchState, { status: 'loading' | 'error' }> {
  if (summary.status === 'empty') {
    return { status: 'empty', message: getHealthScoreExplainedEmptyMessage() };
  }

  const model = buildHealthScoreExplainedViewModel(summary);
  if (model.historyStatus === 'insufficient_history') {
    return { status: 'insufficient_history', model };
  }

  return { status: 'ready', model };
}
