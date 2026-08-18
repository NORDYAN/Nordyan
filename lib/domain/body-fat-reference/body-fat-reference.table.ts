import {
  BODY_FAT_REFERENCE_FITNESS_PERCENTILES,
  type BodyFatReferenceFitnessPercentile,
} from './body-fat-reference.source';

export const BODY_FAT_REFERENCE_TABLE_AGE_GROUPS = [
  '20_29',
  '30_39',
  '40_49',
  '50_59',
  '60_69',
  '70_79',
] as const;
export type BodyFatReferenceTableAgeGroup =
  (typeof BODY_FAT_REFERENCE_TABLE_AGE_GROUPS)[number];

export const BODY_FAT_REFERENCE_TABLE_SEXES = ['male', 'female'] as const;
export type BodyFatReferenceTableSex = (typeof BODY_FAT_REFERENCE_TABLE_SEXES)[number];

export type BodyFatReferenceTableColumn = Record<
  BodyFatReferenceFitnessPercentile,
  number
>;

/**
 * Cooper Institute / ACSM GETP 10th–11th ed. Tables 4.4–4.5.
 * Values are percent body fat. Fitness percentile 99 = leanest tabulated row.
 */
export const ACSM_BODY_FAT_PERCENTILE_TABLE: Record<
  BodyFatReferenceTableSex,
  Record<BodyFatReferenceTableAgeGroup, BodyFatReferenceTableColumn>
> = {
  male: {
    '20_29': {
      99: 4.2, 95: 6.3, 90: 7.9, 85: 9.2, 80: 10.5, 75: 11.5, 70: 12.7, 65: 13.9,
      60: 14.8, 55: 15.8, 50: 16.6, 45: 17.4, 40: 18.6, 35: 19.6, 30: 20.6, 25: 21.9,
      20: 23.1, 15: 24.6, 10: 26.3, 5: 28.9, 1: 33.3,
    },
    '30_39': {
      99: 7.0, 95: 9.9, 90: 11.9, 85: 13.3, 80: 14.5, 75: 15.5, 70: 16.5, 65: 17.4,
      60: 18.2, 55: 19.0, 50: 19.7, 45: 20.4, 40: 21.3, 35: 22.1, 30: 23.0, 25: 23.9,
      20: 24.9, 15: 26.2, 10: 27.8, 5: 30.2, 1: 34.3,
    },
    '40_49': {
      99: 9.2, 95: 12.8, 90: 14.9, 85: 16.3, 80: 17.4, 75: 18.4, 70: 19.1, 65: 19.9,
      60: 20.6, 55: 21.3, 50: 21.9, 45: 22.6, 40: 23.4, 35: 24.1, 30: 24.8, 25: 25.7,
      20: 26.6, 15: 27.7, 10: 29.2, 5: 31.2, 1: 35.0,
    },
    '50_59': {
      99: 10.9, 95: 14.4, 90: 16.7, 85: 18.0, 80: 19.1, 75: 19.9, 70: 20.7, 65: 21.3,
      60: 22.1, 55: 22.7, 50: 23.2, 45: 23.9, 40: 24.6, 35: 25.3, 30: 26.0, 25: 26.8,
      20: 27.8, 15: 28.9, 10: 30.3, 5: 32.5, 1: 36.4,
    },
    '60_69': {
      99: 11.5, 95: 15.5, 90: 17.6, 85: 18.8, 80: 19.7, 75: 20.6, 70: 21.3, 65: 22.0,
      60: 22.6, 55: 23.2, 50: 23.7, 45: 24.4, 40: 25.2, 35: 26.0, 30: 26.7, 25: 27.5,
      20: 28.4, 15: 29.4, 10: 30.9, 5: 32.9, 1: 36.8,
    },
    '70_79': {
      99: 13.6, 95: 15.2, 90: 17.8, 85: 19.2, 80: 20.4, 75: 21.1, 70: 21.6, 65: 22.5,
      60: 23.1, 55: 23.7, 50: 24.1, 45: 24.4, 40: 24.8, 35: 25.4, 30: 26.0, 25: 26.7,
      20: 27.6, 15: 28.9, 10: 30.4, 5: 32.4, 1: 35.5,
    },
  },
  female: {
    '20_29': {
      99: 9.8, 95: 13.6, 90: 14.8, 85: 15.8, 80: 16.5, 75: 17.3, 70: 18.0, 65: 18.7,
      60: 19.4, 55: 20.1, 50: 21.0, 45: 21.9, 40: 22.7, 35: 23.6, 30: 24.5, 25: 25.9,
      20: 27.1, 15: 28.9, 10: 31.4, 5: 35.2, 1: 38.9,
    },
    '30_39': {
      99: 11.0, 95: 14.0, 90: 15.6, 85: 16.6, 80: 17.4, 75: 18.2, 70: 19.1, 65: 20.0,
      60: 20.8, 55: 21.7, 50: 22.6, 45: 23.5, 40: 24.6, 35: 25.6, 30: 26.7, 25: 27.7,
      20: 29.1, 15: 30.9, 10: 33.0, 5: 35.8, 1: 39.4,
    },
    '40_49': {
      99: 12.6, 95: 15.6, 90: 17.2, 85: 18.6, 80: 19.8, 75: 20.8, 70: 21.9, 65: 22.8,
      60: 23.8, 55: 24.8, 50: 25.6, 45: 26.5, 40: 27.6, 35: 28.5, 30: 29.6, 25: 30.7,
      20: 31.9, 15: 33.5, 10: 35.4, 5: 37.4, 1: 39.8,
    },
    '50_59': {
      99: 14.6, 95: 17.2, 90: 19.4, 85: 20.9, 80: 22.5, 75: 23.8, 70: 25.1, 65: 26.0,
      60: 27.0, 55: 27.9, 50: 28.8, 45: 29.7, 40: 30.4, 35: 31.4, 30: 32.5, 25: 33.4,
      20: 34.5, 15: 35.6, 10: 36.7, 5: 38.3, 1: 40.4,
    },
    '60_69': {
      99: 13.9, 95: 17.7, 90: 19.8, 85: 21.4, 80: 23.2, 75: 24.8, 70: 25.9, 65: 27.0,
      60: 27.9, 55: 28.7, 50: 29.8, 45: 30.6, 40: 31.3, 35: 32.5, 30: 33.3, 25: 34.3,
      20: 35.4, 15: 36.2, 10: 37.3, 5: 39.0, 1: 40.8,
    },
    '70_79': {
      99: 14.6, 95: 16.6, 90: 20.3, 85: 23.0, 80: 24.0, 75: 25.0, 70: 26.2, 65: 27.7,
      60: 28.6, 55: 29.7, 50: 30.4, 45: 31.3, 40: 31.8, 35: 32.7, 30: 33.9, 25: 35.3,
      20: 36.0, 15: 37.4, 10: 38.2, 5: 39.3, 1: 40.5,
    },
  },
};

export function getBodyFatReferenceColumn(
  sex: BodyFatReferenceTableSex,
  ageGroup: BodyFatReferenceTableAgeGroup,
): BodyFatReferenceTableColumn {
  return ACSM_BODY_FAT_PERCENTILE_TABLE[sex][ageGroup];
}

export function getBodyFatReferenceMedianPercent(
  sex: BodyFatReferenceTableSex,
  ageGroup: BodyFatReferenceTableAgeGroup,
): number {
  return ACSM_BODY_FAT_PERCENTILE_TABLE[sex][ageGroup][50];
}

export function assertCompleteBodyFatReferenceTable(): void {
  for (const sex of BODY_FAT_REFERENCE_TABLE_SEXES) {
    for (const ageGroup of BODY_FAT_REFERENCE_TABLE_AGE_GROUPS) {
      const column = ACSM_BODY_FAT_PERCENTILE_TABLE[sex][ageGroup];
      let previous: number | null = null;
      for (const percentile of BODY_FAT_REFERENCE_FITNESS_PERCENTILES) {
        const value = column[percentile];
        if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
          throw new Error(`Invalid ACSM body-fat cell ${sex} ${ageGroup} p${percentile}`);
        }
        if (previous != null && value < previous) {
          throw new Error(
            `ACSM body-fat column must be non-decreasing as fitness percentile falls: ${sex} ${ageGroup} p${percentile}`,
          );
        }
        previous = value;
      }
    }
  }
}
