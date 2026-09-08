import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { isProfileComplete } from './is-profile-complete';
import {
  PROFILE_GENDER_VALUES,
  getProfileGenderOptions,
  isWritableProfileGender,
} from './profile-field-options';
import type { UserProfile } from './types';

const completeLegacyOtherProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: null,
  dateOfBirth: '1980-01-01',
  gender: 'other',
  heightCm: 174,
  weightKg: 77,
  waistCm: 86,
  neckCm: 37,
  activityLevel: 'moderately_active',
  goal: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('selectable profile gender options', () => {
  it('exposes exactly male and female', () => {
    assert.deepEqual([...PROFILE_GENDER_VALUES], ['male', 'female']);
    assert.deepEqual(
      getProfileGenderOptions().map((option) => option.value),
      ['male', 'female'],
    );
    assert.equal(
      getProfileGenderOptions().some((option) => option.value === 'other'),
      false,
    );
  });

  it('accepts only male and female as writable values', () => {
    assert.equal(isWritableProfileGender('male'), true);
    assert.equal(isWritableProfileGender('female'), true);
    assert.equal(isWritableProfileGender('other'), false);
    assert.equal(isWritableProfileGender(null), false);
    assert.equal(isWritableProfileGender(undefined), false);
  });

  it('keeps legacy other complete for existing profiles', () => {
    assert.equal(isProfileComplete(completeLegacyOtherProfile), true);
  });
});
