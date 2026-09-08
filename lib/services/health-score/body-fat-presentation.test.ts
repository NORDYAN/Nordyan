import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { canPresentBodyFatEstimate } from './body-fat-presentation';

describe('canPresentBodyFatEstimate', () => {
  it('allows male US Navy presentation with complete user-supplied inputs', () => {
    assert.equal(
      canPresentBodyFatEstimate({ gender: 'male', waistCm: 90, neckCm: 38 }),
      true,
    );
  });

  it('suppresses male fallback or partial anthropometrics', () => {
    assert.equal(
      canPresentBodyFatEstimate({ gender: 'male', waistCm: null, neckCm: null }),
      false,
    );
    assert.equal(
      canPresentBodyFatEstimate({ gender: 'male', waistCm: 90, neckCm: null }),
      false,
    );
  });

  it('accepts a persisted measurement event when profile circumference is empty', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'male', waistCm: null, neckCm: null },
        { waistCm: 90, neckCm: 38 },
      ),
      true,
    );
  });

  it('suppresses female and other Deurenberg estimates', () => {
    assert.equal(
      canPresentBodyFatEstimate({ gender: 'female', waistCm: 80, neckCm: 33 }),
      false,
    );
    assert.equal(
      canPresentBodyFatEstimate({ gender: 'other', waistCm: 85, neckCm: 35 }),
      false,
    );
  });

  it('allows female US Navy presentation from a measurement snapshot with hip', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: 98,
          snapshotReason: 'measurement',
          bodyFatPct: 28.4,
        },
      ),
      true,
    );
  });

  it('allows female US Navy presentation from an onboarding snapshot with real hip', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: 98,
          snapshotReason: 'onboarding',
          bodyFatPct: 28.4,
          bodyFatMethod: 'us_navy',
        },
      ),
      true,
    );
  });

  it('keeps female hip-less or Deurenberg onboarding results unpresentable', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: null,
          snapshotReason: 'onboarding',
          bodyFatPct: 29.1,
          bodyFatMethod: 'deurenberg',
        },
      ),
      false,
    );
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: 98,
          snapshotReason: 'onboarding',
          bodyFatPct: 29.1,
          bodyFatMethod: 'deurenberg',
        },
      ),
      false,
    );
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: null,
          snapshotReason: 'measurement',
          bodyFatPct: 29.1,
        },
      ),
      false,
    );
  });

  it('does not let hip change male presentation rules', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'male', waistCm: 90, neckCm: 38 },
        { waistCm: 90, neckCm: 38, hipCm: 102, snapshotReason: 'measurement', bodyFatPct: 18 },
      ),
      true,
    );
  });
});
