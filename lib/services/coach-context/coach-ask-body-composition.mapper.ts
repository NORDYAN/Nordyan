import type { CoachAskAgeBand, CoachAskBodyComposition, CoachAskSex } from '@/shared/coach-language';
import type { ProfileGender } from '@/lib/domain/profile';
import type { UserProfile } from '@/lib/domain/profile';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import { canPresentBodyFatEstimate } from '@/lib/services/health-score';

function parseIsoDateParts(value: string): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  return { year, month, day };
}

function ageYearsFromDateOfBirth(dateOfBirth: string, asOfDate: string): number {
  const birth = parseIsoDateParts(dateOfBirth);
  const asOf = parseIsoDateParts(asOfDate);
  if (!birth || !asOf) {
    return Number.NaN;
  }

  let age = asOf.year - birth.year;
  if (asOf.month < birth.month || (asOf.month === birth.month && asOf.day < birth.day)) {
    age -= 1;
  }
  return age;
}

export function getLocalCalendarDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mapAgeBandFromDateOfBirth(
  dateOfBirth: string | null | undefined,
  asOfDate: string = getLocalCalendarDate(),
): CoachAskAgeBand | null {
  if (!dateOfBirth) {
    return null;
  }

  const ageYears = ageYearsFromDateOfBirth(dateOfBirth, asOfDate);
  if (!Number.isFinite(ageYears) || ageYears < 18) {
    return null;
  }
  if (ageYears < 30) {
    return '18_29';
  }
  if (ageYears < 40) {
    return '30_39';
  }
  if (ageYears < 50) {
    return '40_49';
  }
  if (ageYears < 60) {
    return '50_59';
  }
  return '60_plus';
}

export function mapCoachAskSex(gender: ProfileGender | null | undefined): CoachAskSex | null {
  if (gender === 'male' || gender === 'female' || gender === 'other') {
    return gender;
  }
  return null;
}

export function mapBodyCompositionFromSnapshot(
  snapshot: Pick<
    HealthSnapshot,
    'bodyFatPct' | 'snapshotReason' | 'waistCm' | 'neckCm'
  > | null,
  profile: Pick<UserProfile, 'gender' | 'waistCm' | 'neckCm'> | null,
): CoachAskBodyComposition {
  const percent = snapshot?.bodyFatPct;
  const measuredCircumferences =
    snapshot?.snapshotReason === 'measurement'
      ? { waistCm: snapshot.waistCm, neckCm: snapshot.neckCm }
      : null;
  if (
    !canPresentBodyFatEstimate(profile, measuredCircumferences) ||
    typeof percent !== 'number' ||
    !Number.isFinite(percent) ||
    percent <= 0
  ) {
    return {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    };
  }

  return {
    status: 'ready',
    bodyFatPercent: percent,
    estimationKind: 'calculated_from_latest_snapshot',
  };
}
