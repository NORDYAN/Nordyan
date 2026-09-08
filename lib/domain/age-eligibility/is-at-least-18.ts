export type CalendarDateParts = {
  year: number;
  month: number;
  day: number;
};

/** Today's local calendar date as YYYY-MM-DD. */
export function getLocalCalendarDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseCalendarDateParts(value: string): CalendarDateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const parsed = new Date(year, month - 1, day);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function calculateCompletedAgeYears(
  dateOfBirth: string,
  asOfDate: string,
): number | null {
  const birth = parseCalendarDateParts(dateOfBirth);
  const asOf = parseCalendarDateParts(asOfDate);

  if (!birth || !asOf) {
    return null;
  }

  let age = asOf.year - birth.year;

  if (asOf.month < birth.month || (asOf.month === birth.month && asOf.day < birth.day)) {
    age -= 1;
  }

  return age;
}

export function isAtLeast18OnDate(dateOfBirth: string, asOfDate: string): boolean {
  const age = calculateCompletedAgeYears(dateOfBirth, asOfDate);
  return age !== null && age >= 18;
}

export function isEligibleAdultDateOfBirth(
  dateOfBirth: string,
  asOfDate: string = getLocalCalendarDate(),
): boolean {
  return isAtLeast18OnDate(dateOfBirth, asOfDate);
}
