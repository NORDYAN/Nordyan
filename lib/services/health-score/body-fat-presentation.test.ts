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
});
