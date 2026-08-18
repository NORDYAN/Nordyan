export {
  BODY_FAT_REFERENCE_FITNESS_PERCENTILES,
  BODY_FAT_REFERENCE_NEAR_MEDIAN_ABS_DELTA,
  BODY_FAT_REFERENCE_SOURCE,
  BODY_FAT_REFERENCE_SOURCE_ID,
} from './body-fat-reference.source';
export type { BodyFatReferenceFitnessPercentile } from './body-fat-reference.source';
export {
  ACSM_BODY_FAT_PERCENTILE_TABLE,
  BODY_FAT_REFERENCE_TABLE_AGE_GROUPS,
  BODY_FAT_REFERENCE_TABLE_SEXES,
  assertCompleteBodyFatReferenceTable,
  getBodyFatReferenceColumn,
  getBodyFatReferenceMedianPercent,
} from './body-fat-reference.table';
export type {
  BodyFatReferenceTableAgeGroup,
  BodyFatReferenceTableColumn,
  BodyFatReferenceTableSex,
} from './body-fat-reference.table';
export {
  BODY_FAT_REFERENCE_INPUT_AGE_BANDS,
  BODY_FAT_REFERENCE_INPUT_SEXES,
  BODY_FAT_REFERENCE_MEDIAN_COMPARISONS,
  BODY_FAT_REFERENCE_POSITION_BANDS,
  BODY_FAT_REFERENCE_UNAVAILABLE_REASONS,
} from './body-fat-reference.types';
export type {
  BodyFatReferenceComparison,
  BodyFatReferenceInput,
  BodyFatReferenceInputAgeBand,
  BodyFatReferenceInputSex,
  BodyFatReferenceMedianComparison,
  BodyFatReferencePositionBand,
  BodyFatReferenceUnavailableReason,
} from './body-fat-reference.types';
export {
  compareBodyFatToAcsmReference,
  mapAgeBandToReferenceAgeGroup,
} from './body-fat-reference';
