import type { FocusType } from '@/lib/domain/focus-engine';

import { APP_LOCALES, type AppLocale } from './locales';
import { hasTranslationKey, t, type TranslationKey } from './translate';

export function matchesTranslatedLabel(label: string, key: TranslationKey): boolean {
  const trimmed = label.trim();
  return APP_LOCALES.some((locale) => t(key, undefined, locale) === trimmed);
}

export function getHealthScoreBandDisplayLabel(score: number, locale?: AppLocale): string {
  if (score >= 85) {
    return t('healthScore.band.excellent', undefined, locale);
  }

  if (score >= 70) {
    return t('healthScore.band.good', undefined, locale);
  }

  if (score >= 55) {
    return t('healthScore.band.moderate', undefined, locale);
  }

  if (score >= 40) {
    return t('healthScore.band.improve', undefined, locale);
  }

  return t('healthScore.band.start', undefined, locale);
}

export function getLocalizedFocusPresentation(focus: FocusType, locale?: AppLocale): {
  title: string;
  subtitle: string;
} {
  const titleKey = `focus.${focus}.title`;
  const subtitleKey = `focus.${focus}.subtitle`;
  return {
    title: hasTranslationKey(titleKey) ? t(titleKey, undefined, locale) : focus,
    subtitle: hasTranslationKey(subtitleKey) ? t(subtitleKey, undefined, locale) : '',
  };
}

function planFrequencyText(frequencyPerWeek: number, locale?: AppLocale): string {
  if (frequencyPerWeek >= 1 && frequencyPerWeek <= 6) {
    const key = `plan.frequency.${frequencyPerWeek}`;
    if (hasTranslationKey(key)) {
      return t(key, undefined, locale);
    }
  }

  return t('plan.frequency.n', { count: frequencyPerWeek }, locale);
}

export function getLocalizedCoachPresentation(
  recommendationId: string,
  durationMinutes: number,
  frequencyPerWeek: number,
  locale?: AppLocale,
): { title: string; description: string } {
  const frequency = planFrequencyText(frequencyPerWeek, locale);
  const titleKey = `plan.${recommendationId}.title`;
  const bodyKey = `plan.${recommendationId}.body`;

  if (hasTranslationKey(titleKey) && hasTranslationKey(bodyKey)) {
    return {
      title: t(titleKey, undefined, locale),
      description: t(bodyKey, { minutes: durationMinutes, frequency }, locale),
    };
  }

  return {
    title: t('plan.default.title', undefined, locale),
    description: t('plan.default.body', { minutes: durationMinutes, frequency }, locale),
  };
}

export function localizeAdviceCopy(id: string): { title: string; subtitle: string } {
  const titleKey = `home.advice.${id}.title`;
  const subtitleKey = `home.advice.${id}.subtitle`;
  return {
    title: hasTranslationKey(titleKey) ? t(titleKey) : id,
    subtitle: hasTranslationKey(subtitleKey) ? t(subtitleKey) : '',
  };
}

export function formatPlanFrequencyCount(frequencyPerWeek: number, locale?: AppLocale): string {
  if (frequencyPerWeek === 1) {
    return t('coach.frequency.once', undefined, locale);
  }

  return t('coach.frequency.many', { count: frequencyPerWeek }, locale);
}
