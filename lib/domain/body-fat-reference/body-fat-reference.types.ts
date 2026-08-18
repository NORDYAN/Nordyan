import type { BodyFatReferenceTableAgeGroup, BodyFatReferenceTableSex } from './body-fat-reference.table';
import type { BODY_FAT_REFERENCE_SOURCE_ID } from './body-fat-reference.source';

export const BODY_FAT_REFERENCE_INPUT_AGE_BANDS = [
  '18_29',
  '30_39',
  '40_49',
  '50_59',
  '60_plus',
] as const;
export type BodyFatReferenceInputAgeBand =
  (typeof BODY_FAT_REFERENCE_INPUT_AGE_BANDS)[number];

export const BODY_FAT_REFERENCE_INPUT_SEXES = ['male', 'female', 'other'] as const;
export type BodyFatReferenceInputSex = (typeof BODY_FAT_REFERENCE_INPUT_SEXES)[number];

export type BodyFatReferenceInput = {
  bodyFatPercent: number | null;
  ageBand: BodyFatReferenceInputAgeBand | null;
  sex: BodyFatReferenceInputSex | null;
};

export const BODY_FAT_REFERENCE_UNAVAILABLE_REASONS = [
  'missing_body_fat_percent',
  'missing_sex',
  'missing_age_band',
  'unsupported_sex',
] as const;
export type BodyFatReferenceUnavailableReason =
  (typeof BODY_FAT_REFERENCE_UNAVAILABLE_REASONS)[number];

export const BODY_FAT_REFERENCE_MEDIAN_COMPARISONS = [
  'below',
  'approximately',
  'above',
] as const;
export type BodyFatReferenceMedianComparison =
  (typeof BODY_FAT_REFERENCE_MEDIAN_COMPARISONS)[number];

/**
 * Position in body-fat % space versus the tabulated column.
 * Not a fitness percentile. `below` means lower body-fat % than the median.
 */
export const BODY_FAT_REFERENCE_POSITION_BANDS = [
  'below_tabulated_range',
  'below_median',
  'near_median',
  'above_median',
  'above_tabulated_range',
] as const;
export type BodyFatReferencePositionBand =
  (typeof BODY_FAT_REFERENCE_POSITION_BANDS)[number];

export type BodyFatReferenceComparison =
  | {
      status: 'ready';
      source: typeof BODY_FAT_REFERENCE_SOURCE_ID;
      sex: BodyFatReferenceTableSex;
      referenceAgeGroup: Exclude<BodyFatReferenceTableAgeGroup, '70_79'>;
      bodyFatPercent: number;
      referenceMedianPercent: number;
      comparisonToReferenceMedian: BodyFatReferenceMedianComparison;
      referencePositionBand: BodyFatReferencePositionBand;
    }
  | {
      status: 'unavailable';
      unavailableReason: BodyFatReferenceUnavailableReason;
    };
