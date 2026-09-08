import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ONBOARDING_PROFILE_DOB_HEIGHT_ARRANGEMENT,
  canContinueOnboardingPersonalProfile,
  onboardingProfileDobHeightLayout,
  resolveSelectableProfileGender,
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

describe('onboarding profile gender continue rule', () => {
  const ready = {
    dateOfBirthValid: true,
    heightValid: true,
    weightValid: true,
    gender: 'male' as const,
    activityLevel: 'moderately_active' as const,
  };

  it('enables continue for male or female only', () => {
    assert.equal(canContinueOnboardingPersonalProfile(ready), true);
    assert.equal(canContinueOnboardingPersonalProfile({ ...ready, gender: 'female' }), true);
    assert.equal(canContinueOnboardingPersonalProfile({ ...ready, gender: 'other' }), false);
    assert.equal(canContinueOnboardingPersonalProfile({ ...ready, gender: null }), false);
  });

  it('treats legacy other as no selectable gender', () => {
    assert.equal(resolveSelectableProfileGender('other'), null);
    assert.equal(resolveSelectableProfileGender('male'), 'male');
    assert.equal(resolveSelectableProfileGender('female'), 'female');
  });
});
