import { formatDecimal, formatDisplayDate, getActiveLocale, t } from '@/lib/i18n';

function parseIsoDateLocal(isoDate: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null;
  }

  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

export function formatMeasurementHistoryDate(isoDate: string): string {
  const date = parseIsoDateLocal(isoDate);
  if (!date) {
    return isoDate;
  }

  return formatDisplayDate(date, getActiveLocale());
}

export function formatMeasurementHistoryWeight(weightKg: number): string {
  return t('common.kg', { value: formatDecimal(weightKg) });
}

export function formatMeasurementHistoryCircumference(valueCm: number): string {
  return t('common.cm', { value: String(Math.round(valueCm)) });
}

/** No measurement-details destination exists in v1. */
export const MEASUREMENT_HISTORY_DETAIL_DESTINATION = null;
