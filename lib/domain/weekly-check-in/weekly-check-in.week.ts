/**
 * Weekly Check-in week identity: local Monday as YYYY-MM-DD.
 * Same local-calendar convention as Measurement / Home day keys.
 * No UTC week, ISO week-number, timezone DB, or server clock.
 */

const LOCAL_CALENDAR_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isWeeklyCheckInLocalCalendarDate(value: string): boolean {
  const match = LOCAL_CALENDAR_DATE.exec(value.trim());
  if (!match) {
    return false;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);

  return (
    local.getFullYear() === year &&
    local.getMonth() === month - 1 &&
    local.getDate() === day
  );
}

function formatLocalCalendarDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the Monday of the local calendar week containing `localCalendarDate`.
 * Monday → same date. Tuesday–Sunday → preceding Monday.
 */
export function getWeeklyCheckInWeekStartDate(localCalendarDate: string): string {
  if (!isWeeklyCheckInLocalCalendarDate(localCalendarDate)) {
    throw new Error('Ogiltigt lokalt kalenderdatum.');
  }

  const match = LOCAL_CALENDAR_DATE.exec(localCalendarDate.trim());
  if (!match) {
    throw new Error('Ogiltigt lokalt kalenderdatum.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  const weekday = local.getDay();
  const daysFromMonday = weekday === 0 ? 6 : weekday - 1;
  local.setDate(local.getDate() - daysFromMonday);

  return formatLocalCalendarDate(local);
}

/**
 * Monday of the local week immediately before the week containing `localCalendarDate`.
 * Reuses {@link getWeeklyCheckInWeekStartDate}; does not introduce a second week system.
 */
export function getPreviousWeeklyCheckInWeekStartDate(localCalendarDate: string): string {
  const weekStartDate = getWeeklyCheckInWeekStartDate(localCalendarDate);
  const match = LOCAL_CALENDAR_DATE.exec(weekStartDate);
  if (!match) {
    throw new Error('Ogiltigt lokalt kalenderdatum.');
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const local = new Date(year, month - 1, day);
  local.setDate(local.getDate() - 7);
  return formatLocalCalendarDate(local);
}
