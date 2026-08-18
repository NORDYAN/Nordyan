import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ONBOARDING_PROFILE_DOB_HEIGHT_ARRANGEMENT,
  onboardingProfileDobHeightLayout,
} from './onboarding-profile.presentation';

describe('onboarding profile DOB/height layout', () => {
  it('stacks Födelsedatum and Längd instead of sharing a narrow row', () => {
    assert.equal(ONBOARDING_PROFILE_DOB_HEIGHT_ARRANGEMENT, 'stack');
    assert.equal(onboardingProfileDobHeightLayout.arrangement, 'stack');
    assert.notEqual(onboardingProfileDobHeightLayout.arrangement, 'row');
    assert.equal(onboardingProfileDobHeightLayout.dateOfBirthStacked, true);
    assert.equal(onboardingProfileDobHeightLayout.heightStacked, true);
  });
});
