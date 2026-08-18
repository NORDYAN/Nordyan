import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  mapAgeBandFromDateOfBirth,
  mapBodyCompositionFromSnapshot,
  mapCoachAskSex,
} from './coach-ask-body-composition.mapper';

describe('mapBodyCompositionFromSnapshot', () => {
  const measuredMaleProfile = {
    gender: 'male' as const,
    waistCm: 90,
    neckCm: 38,
  };
  const onboardingSnapshot = {
    bodyFatPct: 20.1,
    snapshotReason: 'onboarding' as const,
    waistCm: 90,
    neckCm: 38,
  };

  it('maps bodyFatPct when male US Navy inputs are user supplied', () => {
    assert.deepEqual(
      mapBodyCompositionFromSnapshot(onboardingSnapshot, measuredMaleProfile),
      {
        status: 'ready',
        bodyFatPercent: 20.1,
        estimationKind: 'calculated_from_latest_snapshot',
      },
    );
  });

  it('suppresses fallback body fat after circumference measurements were skipped', () => {
    assert.deepEqual(
      mapBodyCompositionFromSnapshot(
        onboardingSnapshot,
        { ...measuredMaleProfile, waistCm: null, neckCm: null },
      ),
      {
        status: 'unavailable',
        bodyFatPercent: null,
        estimationKind: 'unavailable',
      },
    );
  });

  it('suppresses female Deurenberg body fat because hip is not collected', () => {
    assert.deepEqual(
      mapBodyCompositionFromSnapshot(
        { ...onboardingSnapshot, bodyFatPct: 30.1 },
        { gender: 'female', waistCm: 90, neckCm: 34 },
      ),
      {
        status: 'unavailable',
        bodyFatPercent: null,
        estimationKind: 'unavailable',
      },
    );
  });

  it('maps null snapshot bodyFatPct to unavailable', () => {
    assert.deepEqual(
      mapBodyCompositionFromSnapshot(
        { ...onboardingSnapshot, bodyFatPct: null },
        measuredMaleProfile,
      ),
      {
        status: 'unavailable',
        bodyFatPercent: null,
        estimationKind: 'unavailable',
      },
    );
    assert.deepEqual(mapBodyCompositionFromSnapshot(null, measuredMaleProfile), {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    });
  });

  it('allows a real measurement snapshot when profile circumference is still empty', () => {
    assert.deepEqual(
      mapBodyCompositionFromSnapshot(
        { ...onboardingSnapshot, snapshotReason: 'measurement' },
        { ...measuredMaleProfile, waistCm: null, neckCm: null },
      ),
      {
        status: 'ready',
        bodyFatPercent: 20.1,
        estimationKind: 'calculated_from_latest_snapshot',
      },
    );
  });
});

describe('mapAgeBandFromDateOfBirth', () => {
  it('derives ageBand locally without exposing DOB or exact age', () => {
    assert.equal(mapAgeBandFromDateOfBirth('1998-06-15', '2026-08-15'), '18_29');
    assert.equal(mapAgeBandFromDateOfBirth('1990-01-01', '2026-08-15'), '30_39');
    assert.equal(mapAgeBandFromDateOfBirth('1982-08-15', '2026-08-15'), '40_49');
    assert.equal(mapAgeBandFromDateOfBirth('1972-12-01', '2026-08-15'), '50_59');
    assert.equal(mapAgeBandFromDateOfBirth('1960-01-01', '2026-08-15'), '60_plus');
    assert.equal(mapAgeBandFromDateOfBirth(null, '2026-08-15'), null);
    assert.equal(mapAgeBandFromDateOfBirth('2015-01-01', '2026-08-15'), null);
  });
});

describe('mapCoachAskSex', () => {
  it('maps the minimum sex enum', () => {
    assert.equal(mapCoachAskSex('male'), 'male');
    assert.equal(mapCoachAskSex('female'), 'female');
    assert.equal(mapCoachAskSex('other'), 'other');
    assert.equal(mapCoachAskSex(null), null);
  });
});
