import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '@/lib/core';
import type { HealthDataConsentGrant } from '@/lib/domain/health-data-consent';
import type { InitialLifestyleAnswers } from '@/lib/domain/initial-lifestyle';
import type { ProfileMeasurements } from '@/lib/domain/profile';

import {
  hasRequiredAnonymousSignupBaseline,
  type AnonymousSignupBaselineDeps,
} from './anonymous-signup-baseline';
import { createCurrentHealthDataConsentGrant } from './pending-health-data-consent-store';

const completeLifestyle: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

const completeProfile: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'female',
  heightCm: 168,
  weightKg: 62,
  activityLevel: 'moderately_active',
};

const currentConsent = createCurrentHealthDataConsentGrant('2026-08-01T12:00:00.000Z');

function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

function deps(overrides: Partial<{
  lifestyle: Result<InitialLifestyleAnswers | null>;
  age: boolean;
  consent: HealthDataConsentGrant | null;
  profile: ProfileMeasurements | null;
}> = {}): AnonymousSignupBaselineDeps {
  return {
    getUnownedPendingInitialLifestyle: async () =>
      overrides.lifestyle ?? ok(completeLifestyle),
    hasPendingAgeConfirmation: async () => overrides.age ?? true,
    getUnownedPendingHealthDataConsent: async () =>
      overrides.consent === undefined ? currentConsent : overrides.consent,
    getUnownedPendingProfileMeasurements: async () =>
      overrides.profile === undefined ? completeProfile : overrides.profile,
  };
}

describe('hasRequiredAnonymousSignupBaseline', () => {
  it('allows signup when unowned lifestyle, age, consent, and profile are present', async () => {
    assert.equal(await hasRequiredAnonymousSignupBaseline(deps()), true);
  });

  it('rejects a missing unowned Initial Lifestyle payload', async () => {
    assert.equal(
      await hasRequiredAnonymousSignupBaseline(deps({ lifestyle: ok(null) })),
      false,
    );
  });

  it('rejects an incomplete unowned Initial Lifestyle payload', async () => {
    const incomplete = { ...completeLifestyle, alcoholConsumption: undefined };
    assert.equal(
      await hasRequiredAnonymousSignupBaseline(
        deps({ lifestyle: ok(incomplete as InitialLifestyleAnswers) }),
      ),
      false,
    );
  });

  it('rejects missing age confirmation', async () => {
    assert.equal(await hasRequiredAnonymousSignupBaseline(deps({ age: false })), false);
  });

  it('rejects missing current health-data consent', async () => {
    assert.equal(await hasRequiredAnonymousSignupBaseline(deps({ consent: null })), false);
  });

  it('rejects missing unowned pending profile', async () => {
    assert.equal(await hasRequiredAnonymousSignupBaseline(deps({ profile: null })), false);
  });

  it('allows signup after wrong-email release restores anonymous pending data', async () => {
    assert.equal(
      await hasRequiredAnonymousSignupBaseline(
        deps({
          lifestyle: ok(completeLifestyle),
          age: true,
          consent: currentConsent,
          profile: completeProfile,
        }),
      ),
      true,
    );
  });
});
