import { ACTIVITY_SCORES } from '@/lib/domain/health-score/health-score.constants';
import type { HealthScoreActivityLevel } from '@/lib/domain/health-score/health-score.types';
import { t, type TranslationKey } from '@/lib/i18n';

export const ACTIVITY_TREND_LEVELS = Object.keys(
  ACTIVITY_SCORES,
) as HealthScoreActivityLevel[];

export const ACTIVITY_TREND_LEVEL_DOMAIN = {
  min: 0,
  max: ACTIVITY_TREND_LEVELS.length - 1,
} as const;

const ACTIVITY_LEVEL_LABEL_KEYS = {
  sedentary: 'development.driver.activity.level.sedentary',
  light: 'development.driver.activity.level.light',
  moderate: 'development.driver.activity.level.moderate',
  active: 'development.driver.activity.level.active',
  very_active: 'development.driver.activity.level.very_active',
} as const satisfies Record<HealthScoreActivityLevel, TranslationKey>;

export function resolveActivityLevelFromStoredScore(
  score: number,
): HealthScoreActivityLevel | null {
  const rounded = Math.round(score);
  for (const level of ACTIVITY_TREND_LEVELS) {
    if (ACTIVITY_SCORES[level] === rounded) {
      return level;
    }
  }

  return null;
}

export function formatDevelopmentActivityLevelLabel(
  level: HealthScoreActivityLevel,
): string {
  return t(ACTIVITY_LEVEL_LABEL_KEYS[level]);
}

export function resolveActivityTrendPlotLevel(score: number): number | null {
  const level = resolveActivityLevelFromStoredScore(score);
  if (!level) {
    return null;
  }

  return ACTIVITY_TREND_LEVELS.indexOf(level);
}

export function formatDevelopmentActivityTrendLabel(score: number): string {
  const level = resolveActivityLevelFromStoredScore(score);
  if (!level) {
    return t('development.insufficientHistory');
  }

  return formatDevelopmentActivityLevelLabel(level);
}
