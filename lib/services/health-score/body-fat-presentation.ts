import type { BodyFatMethod } from '@/lib/domain/health-score';
import type { UserProfile } from '@/lib/domain/profile';
import { isSupportedHipCm } from '@/lib/domain/measurement';

type BodyFatPresentationProfile = Pick<
  UserProfile,
  'gender' | 'waistCm' | 'neckCm' | 'heightCm'
>;

export type BodyFatPresentationEvidence = {
  waistCm: number | null;
  neckCm: number | null;
  hipCm?: number | null;
  snapshotReason?: string | null;
  bodyFatPct?: number | null;
  bodyFatMethod?: BodyFatMethod | null;
};

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

function hasValidMaleCircumferences(value: {
  waistCm: number | null | undefined;
  neckCm: number | null | undefined;
}): boolean {
  return (
    isPositiveNumber(value.waistCm) &&
    isPositiveNumber(value.neckCm) &&
    value.waistCm > value.neckCm
  );
}

function isMeasurementEvidence(evidence: BodyFatPresentationEvidence): boolean {
  return evidence.snapshotReason == null || evidence.snapshotReason === 'measurement';
}

function isFemaleNavyMethod(evidence: BodyFatPresentationEvidence): boolean {
  if (evidence.bodyFatMethod === 'deurenberg') {
    return false;
  }

  return evidence.bodyFatMethod === 'us_navy' || evidence.bodyFatMethod == null;
}

function hasFemaleNavyProvenance(evidence: BodyFatPresentationEvidence): boolean {
  if (evidence.snapshotReason === 'measurement') {
    return true;
  }

  return (
    evidence.snapshotReason === 'onboarding' &&
    isSupportedHipCm(evidence.hipCm ?? Number.NaN)
  );
}

function hasValidFemaleNavyEvidence(
  evidence: BodyFatPresentationEvidence,
  heightCm: number | null | undefined,
): boolean {
  return (
    hasFemaleNavyProvenance(evidence) &&
    isFemaleNavyMethod(evidence) &&
    isPositiveNumber(heightCm) &&
    isPositiveNumber(evidence.waistCm) &&
    isPositiveNumber(evidence.neckCm) &&
    isSupportedHipCm(evidence.hipCm ?? Number.NaN) &&
    isPositiveNumber(evidence.bodyFatPct)
  );
}

/**
 * A numeric body-fat estimate is user-visible only when the current production
 * formula can use a complete set of user-supplied measurements.
 *
 * Male: US Navy from waist + neck + height. Hip is ignored.
 * Female: US Navy from a measurement snapshot, or an onboarding snapshot that
 * includes a real hip reading, plus waist + neck + profile height and a finite
 * bodyFatPct. Deurenberg stays internal. Hip is never imputed.
 */
export function canPresentBodyFatEstimate(
  profile: BodyFatPresentationProfile | null,
  evidence?: BodyFatPresentationEvidence | null,
): boolean {
  if (profile?.gender === 'male') {
    return (
      hasValidMaleCircumferences(profile) ||
      (evidence != null &&
        isMeasurementEvidence(evidence) &&
        hasValidMaleCircumferences(evidence))
    );
  }

  if (profile?.gender === 'female') {
    return evidence != null && hasValidFemaleNavyEvidence(evidence, profile.heightCm);
  }

  return false;
}
