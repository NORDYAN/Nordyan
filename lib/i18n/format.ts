import { APP_INTL_LOCALE, DEFAULT_APP_LOCALE, type AppLocale } from './locales';

export function intlLocaleFor(locale: AppLocale = DEFAULT_APP_LOCALE): string {
  return APP_INTL_LOCALE[locale];
}

export function formatDisplayDate(
  date: Date,
  locale: AppLocale = DEFAULT_APP_LOCALE,
  options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' },
): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), options).format(date);
}

export function formatDecimal(
  value: number,
  locale: AppLocale = DEFAULT_APP_LOCALE,
  fractionDigits = 1,
): string {
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}
