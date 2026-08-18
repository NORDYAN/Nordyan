import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

import {
  ACSM_BODY_FAT_PERCENTILE_TABLE,
  BODY_FAT_REFERENCE_SOURCE,
  BODY_FAT_REFERENCE_SOURCE_ID,
  assertCompleteBodyFatReferenceTable,
  compareBodyFatToAcsmReference,
  getBodyFatReferenceMedianPercent,
  mapAgeBandToReferenceAgeGroup,
} from './index';

describe('ACSM body-fat reference table', () => {
  it('is complete and non-decreasing as fitness percentile falls', () => {
    assert.doesNotThrow(() => assertCompleteBodyFatReferenceTable());
  });

  it('uses the documented ACSM/Cooper source, not Health Score midpoints', () => {
    assert.equal(BODY_FAT_REFERENCE_SOURCE.id, 'acsm_getp_10_11_cooper_institute');
    assert.equal(
      BODY_FAT_REFERENCE_SOURCE.fitnessPercentileOrientation,
      'higher_percentile_means_lower_body_fat',
    );
    assert.match(BODY_FAT_REFERENCE_SOURCE.tables, /4\.4/);
    assert.match(BODY_FAT_REFERENCE_SOURCE.tables, /4\.5/);
  });

  it('locks exact published medians for male and female age bands', () => {
    assert.equal(getBodyFatReferenceMedianPercent('male', '20_29'), 16.6);
    assert.equal(getBodyFatReferenceMedianPercent('male', '30_39'), 19.7);
    assert.equal(getBodyFatReferenceMedianPercent('male', '40_49'), 21.9);
    assert.equal(getBodyFatReferenceMedianPercent('male', '50_59'), 23.2);
    assert.equal(getBodyFatReferenceMedianPercent('male', '60_69'), 23.7);
    assert.equal(getBodyFatReferenceMedianPercent('female', '20_29'), 21.0);
    assert.equal(getBodyFatReferenceMedianPercent('female', '30_39'), 22.6);
    assert.equal(getBodyFatReferenceMedianPercent('female', '40_49'), 25.6);
    assert.equal(getBodyFatReferenceMedianPercent('female', '50_59'), 28.8);
    assert.equal(getBodyFatReferenceMedianPercent('female', '60_69'), 29.8);
  });

  it('locks an exact non-median table point', () => {
    assert.equal(ACSM_BODY_FAT_PERCENTILE_TABLE.male['50_59'][70], 20.7);
    assert.equal(ACSM_BODY_FAT_PERCENTILE_TABLE.female['40_49'][90], 17.2);
  });
});

describe('mapAgeBandToReferenceAgeGroup', () => {
  it('maps NORDYAN bands onto ACSM columns without requiring exact age', () => {
    assert.equal(mapAgeBandToReferenceAgeGroup('18_29'), '20_29');
    assert.equal(mapAgeBandToReferenceAgeGroup('30_39'), '30_39');
    assert.equal(mapAgeBandToReferenceAgeGroup('40_49'), '40_49');
    assert.equal(mapAgeBandToReferenceAgeGroup('50_59'), '50_59');
    assert.equal(mapAgeBandToReferenceAgeGroup('60_plus'), '60_69');
  });
});

describe('compareBodyFatToAcsmReference', () => {
  it('compares the product example below the male 50-59 median', () => {
    const result = compareBodyFatToAcsmReference({
      bodyFatPercent: 20.83,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.deepEqual(result, {
      status: 'ready',
      source: BODY_FAT_REFERENCE_SOURCE_ID,
      sex: 'male',
      referenceAgeGroup: '50_59',
      bodyFatPercent: 20.83,
      referenceMedianPercent: 23.2,
      comparisonToReferenceMedian: 'below',
      referencePositionBand: 'below_median',
    });
  });

  it('treats an exact median table point as approximately / near_median', () => {
    const result = compareBodyFatToAcsmReference({
      bodyFatPercent: 23.2,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.comparisonToReferenceMedian, 'approximately');
    assert.equal(result.referencePositionBand, 'near_median');
  });

  it('classifies values between table points without interpolating a fake percentile', () => {
    const result = compareBodyFatToAcsmReference({
      bodyFatPercent: 21.0,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.referenceMedianPercent, 23.2);
    assert.equal(result.comparisonToReferenceMedian, 'below');
    assert.equal('percentile' in result, false);
    assert.equal('estimatedPercentile' in result, false);
  });

  it('marks values above the median and above the tabulated range', () => {
    const aboveMedian = compareBodyFatToAcsmReference({
      bodyFatPercent: 26.0,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(aboveMedian.status, 'ready');
    if (aboveMedian.status === 'ready') {
      assert.equal(aboveMedian.comparisonToReferenceMedian, 'above');
      assert.equal(aboveMedian.referencePositionBand, 'above_median');
    }

    const aboveRange = compareBodyFatToAcsmReference({
      bodyFatPercent: 40,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(aboveRange.status, 'ready');
    if (aboveRange.status === 'ready') {
      assert.equal(aboveRange.comparisonToReferenceMedian, 'above');
      assert.equal(aboveRange.referencePositionBand, 'above_tabulated_range');
    }
  });

  it('marks values below the tabulated range', () => {
    const result = compareBodyFatToAcsmReference({
      bodyFatPercent: 8,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.comparisonToReferenceMedian, 'below');
    assert.equal(result.referencePositionBand, 'below_tabulated_range');
  });

  it('does not invert fitness-percentile orientation: lower body fat is below median, not worse', () => {
    const leaner = compareBodyFatToAcsmReference({
      bodyFatPercent: 16.7,
      ageBand: '50_59',
      sex: 'male',
    });
    const higherFat = compareBodyFatToAcsmReference({
      bodyFatPercent: 30.3,
      ageBand: '50_59',
      sex: 'male',
    });
    assert.equal(leaner.status, 'ready');
    assert.equal(higherFat.status, 'ready');
    if (leaner.status !== 'ready' || higherFat.status !== 'ready') {
      return;
    }
    assert.equal(leaner.comparisonToReferenceMedian, 'below');
    assert.equal(higherFat.comparisonToReferenceMedian, 'above');
    assert.notEqual(leaner.comparisonToReferenceMedian, 'above');
  });

  it('compares female age bands against their own medians', () => {
    const result = compareBodyFatToAcsmReference({
      bodyFatPercent: 22.6,
      ageBand: '30_39',
      sex: 'female',
    });
    assert.equal(result.status, 'ready');
    if (result.status !== 'ready') {
      return;
    }
    assert.equal(result.referenceMedianPercent, 22.6);
    assert.equal(result.comparisonToReferenceMedian, 'approximately');
    assert.equal(result.sex, 'female');
  });

  it('returns unavailable for missing body-fat, sex, ageBand, and unsupported sex', () => {
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: null, ageBand: '50_59', sex: 'male' }),
      { status: 'unavailable', unavailableReason: 'missing_body_fat_percent' },
    );
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: 20.8, ageBand: '50_59', sex: null }),
      { status: 'unavailable', unavailableReason: 'missing_sex' },
    );
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: 20.8, ageBand: null, sex: 'male' }),
      { status: 'unavailable', unavailableReason: 'missing_age_band' },
    );
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: 20.8, ageBand: '50_59', sex: 'other' }),
      { status: 'unavailable', unavailableReason: 'unsupported_sex' },
    );
  });

  it('prefers missing body-fat over missing sex/age, then age over unsupported sex', () => {
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: null, ageBand: null, sex: null }),
      { status: 'unavailable', unavailableReason: 'missing_body_fat_percent' },
    );
    assert.deepEqual(
      compareBodyFatToAcsmReference({ bodyFatPercent: 20.8, ageBand: null, sex: 'other' }),
      { status: 'unavailable', unavailableReason: 'missing_age_band' },
    );
  });

  it('maps 18_29 and 60_plus onto the supported ACSM columns', () => {
    const youngFemale = compareBodyFatToAcsmReference({
      bodyFatPercent: 21.0,
      ageBand: '18_29',
      sex: 'female',
    });
    assert.equal(youngFemale.status, 'ready');
    if (youngFemale.status === 'ready') {
      assert.equal(youngFemale.referenceAgeGroup, '20_29');
      assert.equal(youngFemale.referenceMedianPercent, 21.0);
    }

    const olderMale = compareBodyFatToAcsmReference({
      bodyFatPercent: 23.7,
      ageBand: '60_plus',
      sex: 'male',
    });
    assert.equal(olderMale.status, 'ready');
    if (olderMale.status === 'ready') {
      assert.equal(olderMale.referenceAgeGroup, '60_69');
      assert.equal(olderMale.referenceMedianPercent, 23.7);
      assert.equal(olderMale.comparisonToReferenceMedian, 'approximately');
    }
  });
});

describe('body-fat reference engine isolation', () => {
  it('does not import Health Score scoring internals', () => {
    const dir = path.dirname(fileURLToPath(import.meta.url));
    const source = [
      readFileSync(path.join(dir, 'body-fat-reference.ts'), 'utf8'),
      readFileSync(path.join(dir, 'body-fat-reference.table.ts'), 'utf8'),
      readFileSync(path.join(dir, 'body-fat-reference.source.ts'), 'utf8'),
      readFileSync(path.join(dir, 'body-fat-reference.types.ts'), 'utf8'),
    ].join('\n');
    assert.equal(source.includes('health-score-engine'), false);
    assert.equal(source.includes('BODY_FAT_REFERENCE_MIDPOINTS'), false);
    assert.equal(source.includes('classifyBodyFat'), false);
    assert.equal(source.includes('bodyFatCategory'), false);
    assert.equal(source.includes('focus-engine'), false);
    assert.equal(source.includes('coach-engine'), false);
  });
});
