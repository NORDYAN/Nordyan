import { DEFAULT_APP_LOCALE, type AppLocale } from './locales';
import { nb } from './resources/nb';
import { sv, type TranslationKey } from './resources/sv';

export type { TranslationKey };

type TranslationTable = Record<TranslationKey, string>;

const RESOURCES: Record<AppLocale, TranslationTable> = {
  sv,
  nb,
};

let activeLocale: AppLocale = DEFAULT_APP_LOCALE;
const listeners = new Set<() => void>();

export type TranslateParams = Record<string, string | number>;

function interpolate(template: string, params?: TranslateParams): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = params[name];
    return value == null ? match : String(value);
  });
}

export function lookupTranslation(
  locale: AppLocale,
  key: TranslationKey,
  fallbackLocale: AppLocale = DEFAULT_APP_LOCALE,
): string {
  const primary = RESOURCES[locale]?.[key];
  if (primary) {
    return primary;
  }

  return RESOURCES[fallbackLocale]?.[key] ?? key;
}

export function getActiveLocale(): AppLocale {
  return activeLocale;
}

export function setActiveLocale(locale: AppLocale): void {
  if (activeLocale === locale) {
    return;
  }

  activeLocale = locale;
  for (const listener of listeners) {
    listener();
  }
}

export function subscribeToLocale(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function t(
  key: TranslationKey,
  params?: TranslateParams,
  locale: AppLocale = activeLocale,
): string {
  return interpolate(lookupTranslation(locale, key), params);
}

export function hasTranslationKey(value: string): value is TranslationKey {
  return value in sv;
}
