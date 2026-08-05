import type {
  HealthScoreActivityLevel,
  HealthScoreGender,
  HealthScoreInput,
} from '@/lib/domain/health-score';
import { INPUT_LIMITS } from '@/lib/domain/health-score/health-score.constants';
import { calculateBmi } from '@/lib/domain/health-score/health-score.utils';
import type { ProfileActivityLevel, ProfileGender, UserProfile } from '@/lib/domain/profile';

const PROFILE_TO_ENGINE_ACTIVITY: Record<ProfileActivityLevel, HealthScoreActivityLevel> = {
  sedentary: 'sedentary',
  lightly_active: 'light',
  moderately_active: 'moderate',
  very_active: 'active',
  extra_active: 'very_active',
};

function isHealthScoreGender(value: ProfileGender | null): value is HealthScoreGender {
  return value === 'male' || value === 'female' || value === 'other';
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}/.test(value.trim());
}

/** Today's local calendar date as YYYY-MM-DD (created outside the pure engine). */
export function getLocalCalendarDate(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
  const day = String(referenceDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function mapProfileActivityLevel(
  activityLevel: ProfileActivityLevel | null,
): HealthScoreActivityLevel | null {
  if (!activityLevel) {
    return null;
  }

  return PROFILE_TO_ENGINE_ACTIVITY[activityLevel] ?? null;
}

function clampToRange(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Estimates waist/neck for preliminary onboarding scores when circumference
 * measurements have not yet been collected via Health → New Measurement.
 */
export function estimatePreliminaryAnthropometrics(
  heightCm: number,
  weightKg: number,
  gender: HealthScoreGender,
): { waistCm: number; neckCm: number } {
  const bmi = calculateBmi(weightKg, heightCm);
  const neckCm = clampToRange(
    gender === 'female' ? heightCm * 0.16 : heightCm * 0.18,
    INPUT_LIMITS.neckCm.min,
    INPUT_LIMITS.neckCm.max,
  );
  const whtrTarget = bmi < 25 ? 0.47 : bmi < 30 ? 0.51 : 0.54;
  const waistCm = clampToRange(
    Math.max(heightCm * whtrTarget, neckCm + 5),
    INPUT_LIMITS.waistCm.min,
    INPUT_LIMITS.waistCm.max,
  );

  return { waistCm, neckCm };
}

export function mapProfileToHealthScoreInput(
  profile: UserProfile,
  asOfDate: string = getLocalCalendarDate(),
): HealthScoreInput | null {
  if (!profile.dateOfBirth || !isValidIsoDate(profile.dateOfBirth)) {
    return null;
  }

  if (!isHealthScoreGender(profile.gender)) {
    return null;
  }

  if (!isPositiveNumber(profile.heightCm) || !isPositiveNumber(profile.weightKg)) {
    return null;
  }

  const activityLevel = mapProfileActivityLevel(profile.activityLevel);
  if (!activityLevel) {
    return null;
  }

  let waistCm = profile.waistCm;
  let neckCm = profile.neckCm;

  if (!isPositiveNumber(waistCm) || !isPositiveNumber(neckCm)) {
    const estimated = estimatePreliminaryAnthropometrics(
      profile.heightCm,
      profile.weightKg,
      profile.gender,
    );
    waistCm = isPositiveNumber(waistCm) ? waistCm : estimated.waistCm;
    neckCm = isPositiveNumber(neckCm) ? neckCm : estimated.neckCm;
  }

  return {
    dateOfBirth: profile.dateOfBirth,
    gender: profile.gender,
    heightCm: profile.heightCm,
    weightKg: profile.weightKg,
    waistCm,
    neckCm,
    activityLevel,
    asOfDate,
  };
}
