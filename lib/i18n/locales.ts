export const APP_LOCALES = ['sv', 'nb'] as const;

export type AppLocale = (typeof APP_LOCALES)[number];

export const DEFAULT_APP_LOCALE: AppLocale = 'sv';

export const APP_INTL_LOCALE: Record<AppLocale, string> = {
  sv: 'sv-SE',
  nb: 'nb-NO',
};

export const LANGUAGE_STORAGE_DEVICE_KEY = '@nordyan/locale/device';
/** Unauthenticated manual override. Never written for a signed-in selection. */
export const LANGUAGE_STORAGE_MANUAL_KEY = '@nordyan/locale/manual';

export function languageStorageUserKey(userId: string): string {
  return `@nordyan/locale/user/${userId.trim()}`;
}

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return value === 'sv' || value === 'nb';
}
