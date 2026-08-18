import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { mapBodyFatReferenceForCoachAsk } from './coach-ask-body-fat-reference.mapper';

const readyComposition = {
  status: 'ready' as const,
  bodyFatPercent: 20.83,
  estimationKind: 'calculated_from_latest_snapshot' as const,
};

describe('mapBodyFatReferenceForCoachAsk', () => {
  it('maps the product example without exposing a percentile or the ACSM table', () => {
    const result = mapBodyFatReferenceForCoachAsk({
      bodyComposition: readyComposition,
      ageBand: '50_59',
      sex: 'male',
    });

    assert.deepEqual(result, {
      status: 'ready',
      source: 'acsm_getp_10_11_cooper_institute',
      sex: 'male',
      referenceAgeGroup: '50_59',
      bodyFatPercent: 20.83,
      referenceMedianPercent: 23.2,
      comparisonToReferenceMedian: 'below',
      referencePositionBand: 'below_median',
    });
    assert.equal('percentile' in result, false);
    assert.equal(JSON.stringify(result).includes('acsmTable'), false);
  });

  it('returns unavailable when calculated body fat, sex, or ageBand is missing', () => {
    assert.deepEqual(
      mapBodyFatReferenceForCoachAsk({
        bodyComposition: {
          status: 'unavailable',
          bodyFatPercent: null,
          estimationKind: 'unavailable',
        },
        ageBand: '50_59',
        sex: 'male',
      }),
      { status: 'unavailable', unavailableReason: 'missing_body_fat_percent' },
    );
    assert.deepEqual(
      mapBodyFatReferenceForCoachAsk({
        bodyComposition: readyComposition,
        ageBand: '50_59',
        sex: null,
      }),
      { status: 'unavailable', unavailableReason: 'missing_sex' },
    );
    assert.deepEqual(
      mapBodyFatReferenceForCoachAsk({
        bodyComposition: readyComposition,
        ageBand: null,
        sex: 'female',
      }),
      { status: 'unavailable', unavailableReason: 'missing_age_band' },
    );
    assert.deepEqual(
      mapBodyFatReferenceForCoachAsk({
        bodyComposition: readyComposition,
        ageBand: '40_49',
        sex: 'other',
      }),
      { status: 'unavailable', unavailableReason: 'unsupported_sex' },
    );
  });
});
