import { BODY_FAT_REFERENCE_NEAR_MEDIAN_ABS_DELTA, BODY_FAT_REFERENCE_SOURCE_ID } from './body-fat-reference.source';
import {
  getBodyFatReferenceColumn,
  type BodyFatReferenceTableAgeGroup,
} from './body-fat-reference.table';
import type {
  BodyFatReferenceComparison,
  BodyFatReferenceInput,
  BodyFatReferenceInputAgeBand,
  BodyFatReferenceMedianComparison,
  BodyFatReferencePositionBand,
} from './body-fat-reference.types';

/**
 * NORDYAN ageBand → ACSM/Cooper column.
 * 18–19 uses the 20–29 column (source starts at 20).
 * 60_plus uses 60–69 because exact age is never sent; 70–79 is retained in the
 * table for completeness but is not selected without exact age.
 */
export function mapAgeBandToReferenceAgeGroup(
  ageBand: BodyFatReferenceInputAgeBand,
): Exclude<BodyFatReferenceTableAgeGroup, '70_79'> {
  if (ageBand === '18_29') {
    return '20_29';
  }
  if (ageBand === '60_plus') {
    return '60_69';
  }
  return ageBand;
}

function compareToMedian(
  bodyFatPercent: number,
  median: number,
): BodyFatReferenceMedianComparison {
  const delta = bodyFatPercent - median;
  if (Math.abs(delta) <= BODY_FAT_REFERENCE_NEAR_MEDIAN_ABS_DELTA) {
    return 'approximately';
  }
  return delta < 0 ? 'below' : 'above';
}

function positionBand(
  bodyFatPercent: number,
  leanestTabulated: number,
  highestTabulated: number,
  medianComparison: BodyFatReferenceMedianComparison,
): BodyFatReferencePositionBand {
  if (bodyFatPercent < leanestTabulated) {
    return 'below_tabulated_range';
  }
  if (bodyFatPercent > highestTabulated) {
    return 'above_tabulated_range';
  }
  if (medianComparison === 'approximately') {
    return 'near_median';
  }
  return medianComparison === 'below' ? 'below_median' : 'above_median';
}

export function compareBodyFatToAcsmReference(
  input: BodyFatReferenceInput,
): BodyFatReferenceComparison {
  const percent = input.bodyFatPercent;
  if (typeof percent !== 'number' || !Number.isFinite(percent) || percent <= 0) {
    return { status: 'unavailable', unavailableReason: 'missing_body_fat_percent' };
  }
  if (input.sex == null) {
    return { status: 'unavailable', unavailableReason: 'missing_sex' };
  }
  if (input.ageBand == null) {
    return { status: 'unavailable', unavailableReason: 'missing_age_band' };
  }
  if (input.sex === 'other') {
    return { status: 'unavailable', unavailableReason: 'unsupported_sex' };
  }

  const referenceAgeGroup = mapAgeBandToReferenceAgeGroup(input.ageBand);
  const column = getBodyFatReferenceColumn(input.sex, referenceAgeGroup);
  const referenceMedianPercent = column[50];
  const comparisonToReferenceMedian = compareToMedian(percent, referenceMedianPercent);

  return {
    status: 'ready',
    source: BODY_FAT_REFERENCE_SOURCE_ID,
    sex: input.sex,
    referenceAgeGroup,
    bodyFatPercent: percent,
    referenceMedianPercent,
    comparisonToReferenceMedian,
    referencePositionBand: positionBand(percent, column[99], column[1], comparisonToReferenceMedian),
  };
}
