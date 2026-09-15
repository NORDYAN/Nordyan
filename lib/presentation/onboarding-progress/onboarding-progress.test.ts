import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { setActiveLocale } from '@/lib/i18n';

import {
  ONBOARDING_MAJOR_STEP_COUNT,
  formatOnboardingMajorProgress,
  onboardingMajorProgress,
  onboardingMajorStepForOptionalMeasurements,
} from './onboarding-progress';

describe('onboarding major progress', () => {
  it('counts six required major steps', () => {
    assert.equal(ONBOARDING_MAJOR_STEP_COUNT, 6);
    assert.deepEqual(onboardingMajorProgress('product-value'), { current: 1, total: 6 });
    assert.deepEqual(onboardingMajorProgress('legal'), { current: 2, total: 6 });
    assert.deepEqual(onboardingMajorProgress('lifestyle'), { current: 3, total: 6 });
    assert.deepEqual(onboardingMajorProgress('profile'), { current: 4, total: 6 });
    assert.deepEqual(onboardingMajorProgress('result'), { current: 5, total: 6 });
    assert.deepEqual(onboardingMajorProgress('account'), { current: 6, total: 6 });
  });

  it('keeps optional measurements on the personal-profile major step', () => {
    assert.equal(onboardingMajorStepForOptionalMeasurements(), 'profile');
    assert.deepEqual(
      onboardingMajorProgress(onboardingMajorStepForOptionalMeasurements()),
      onboardingMajorProgress('profile'),
    );
  });

  it('formats Swedish progress copy', () => {
    setActiveLocale('sv');
    assert.equal(formatOnboardingMajorProgress('legal'), '2 av 6');
    setActiveLocale('sv');
  });
});
