import type { ProgressSummary } from '@/lib/domain/progress';
import { t } from '@/lib/i18n';

export function formatHomeProgressDeltaLabel(summary: ProgressSummary): string | null {
  if (summary.trend === 'insufficient_history') {
    return null;
  }

  if (summary.trend === 'improving') {
    return t('development.score.up', { change: summary.scoreChange });
  }

  if (summary.trend === 'declining') {
    return t('development.score.down', { change: summary.scoreChange });
  }

  return t('development.score.stable');
}

export function getHomeProgressInsufficientLine1(): string {
  return t('home.progress.insufficient1');
}

export function getHomeProgressInsufficientLine2(): string {
  return t('home.progress.insufficient2');
}

export function getHomeProgressUnavailableMessage(): string {
  return t('home.progress.unavailable');
}
