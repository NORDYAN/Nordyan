import { DEFAULT_APP_LOCALE, type AppLocale } from './locales';

function normalizeTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/_/g, '-');
}

/**
 * Maps device language tags to an MVP product locale.
 * Norwegian Bokmål, generic Norwegian, and Nynorsk all select `nb`.
 * Anything else falls back to Swedish.
 */
export function resolveAppLocaleFromLanguageTags(
  tags: readonly string[],
): AppLocale {
  for (const raw of tags) {
    const tag = normalizeTag(raw);
    if (!tag) {
      continue;
    }

    const language = tag.split('-')[0] ?? '';
    if (language === 'sv') {
      return 'sv';
    }

    if (language === 'nb' || language === 'nn' || language === 'no') {
      return 'nb';
    }
  }

  return DEFAULT_APP_LOCALE;
}

export function resolvePersistedAppLocale(value: string | null | undefined): AppLocale | null {
  if (value === 'sv' || value === 'nb') {
    return value;
  }

  return null;
}
