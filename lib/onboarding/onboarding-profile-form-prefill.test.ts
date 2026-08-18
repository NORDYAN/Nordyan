import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ProfileMeasurements, UserProfile } from '../domain/profile';
import { resolveOnboardingProfileFormPrefill } from './onboarding-profile-form-prefill';

const pending: ProfileMeasurements = {
  dateOfBirth: '1990-05-05',
  gender: 'female',
  heightCm: 150,
  weightKg: 50,
  activityLevel: 'sedentary',
};

const cachedProfile: Pick<
  UserProfile,
  'dateOfBirth' | 'gender' | 'heightCm' | 'weightKg' | 'activityLevel'
> = {
  dateOfBirth: '1990-05-05T00:00:00.000Z',
  gender: 'female',
  heightCm: 150,
  weightKg: 50,
  activityLevel: 'sedentary',
};

describe('resolveOnboardingProfileFormPrefill', () => {
  it('uses visible pending measurements when present', () => {
    assert.deepEqual(
      resolveOnboardingProfileFormPrefill({
        pending,
        authenticatedProfile: cachedProfile,
        userId: null,
      }),
      {
        dateOfBirth: '1990-05-05',
        height: '150',
        weight: '50',
        gender: 'female',
        activityLevel: 'sedentary',
      },
    );
  });

  it('falls back to the authenticated user profile only while signed in', () => {
    assert.deepEqual(
      resolveOnboardingProfileFormPrefill({
        pending: null,
        authenticatedProfile: cachedProfile,
        userId: 'user-a',
      }),
      {
        dateOfBirth: '1990-05-05',
        height: '150',
        weight: '50',
        gender: 'female',
        activityLevel: 'sedentary',
      },
    );
  });

  it('starts blank after logout even if a previous profile is still cached', () => {
    assert.deepEqual(
      resolveOnboardingProfileFormPrefill({
        pending: null,
        authenticatedProfile: cachedProfile,
        userId: null,
      }),
      {
        dateOfBirth: '',
        height: '',
        weight: '',
        gender: null,
        activityLevel: null,
      },
    );
  });
});
