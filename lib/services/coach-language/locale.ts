import type { AppLocale } from '@/lib/i18n';

/**
 * Home `/generate` is a frozen Swedish-only contract.
 * Bokmål must use the localized deterministic template until a versioned
 * generate contract explicitly supports `nb-NO`.
 */
export function isHomeCoachGeneratedLocaleSupported(locale: AppLocale): boolean {
  return locale === 'sv';
}
