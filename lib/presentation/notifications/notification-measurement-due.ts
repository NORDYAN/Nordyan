import { getLocalCalendarDate } from '@/lib/services/health-score/health-score.mapper';

const LOCAL_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcMidnightFromLocalCalendarDate(value: string): number | null {
  const match = LOCAL_CALENDAR_DATE.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const utc = Date.UTC(year, month - 1, day);
  const parsed = new Date(utc);
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }

  return utc;
}

/** Local calendar-day difference (to − from). Invalid or unparsable dates return null. */
export function calendarDaysSinceMeasuredAt(
  measuredAt: string,
  asOfDate: string = getLocalCalendarDate(),
): number | null {
  const from = utcMidnightFromLocalCalendarDate(measuredAt);
  const to = utcMidnightFromLocalCalendarDate(asOfDate);
  if (from === null || to === null) {
    return null;
  }

  return Math.round((to - from) / MS_PER_DAY);
}

export function isWeeklyMeasurementDue(
  measuredAt: string | null | undefined,
  asOfDate: string = getLocalCalendarDate(),
): boolean {
  if (!measuredAt) {
    return false;
  }

  const days = calendarDaysSinceMeasuredAt(measuredAt, asOfDate);
  return days !== null && days >= 14;
}

export function weeklyMeasurementDueFromHistoryResult(result: {
  ok: boolean;
  value?: ReadonlyArray<{ measuredAt: string }>;
}): boolean {
  if (!result.ok || !result.value?.length) {
    return false;
  }

  return isWeeklyMeasurementDue(result.value[0].measuredAt);
}
