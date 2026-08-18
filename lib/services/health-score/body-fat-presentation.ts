import type { UserProfile } from '@/lib/domain/profile';

type BodyFatPresentationProfile = Pick<
  UserProfile,
  'gender' | 'waistCm' | 'neckCm'
>;

type MeasuredCircumferences = {
  waistCm: number | null;
  neckCm: number | null;
};

function isPositiveNumber(value: number | null): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasValidCircumferences(value: MeasuredCircumferences): boolean {
  return (
    isPositiveNumber(value.waistCm) &&
    isPositiveNumber(value.neckCm) &&
    value.waistCm > value.neckCm
  );
}

/**
 * A numeric body-fat estimate is user-visible only when the current production
 * formula can use a complete set of user-supplied circumference measurements.
 *
 * Male profiles use waist + neck with US Navy. Female US Navy additionally
 * requires hip circumference, which the current profile model cannot store.
 * Female and other profiles therefore use Deurenberg and remain unavailable
 * in presentation even when Health Score uses that fallback internally.
 */
export function canPresentBodyFatEstimate(
  profile: BodyFatPresentationProfile | null,
  measuredCircumferences?: MeasuredCircumferences | null,
): boolean {
  if (profile?.gender !== 'male') {
    return false;
  }

  return (
    hasValidCircumferences(profile) ||
    (measuredCircumferences != null && hasValidCircumferences(measuredCircumferences))
  );
}
