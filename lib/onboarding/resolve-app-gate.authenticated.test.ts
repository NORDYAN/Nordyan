import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { UserProfile } from '@/lib/domain/profile';

import {
  resolveAppGate,
  resolveAuthenticatedOnboardingGate,
  type AuthenticatedOnboardingGateDeps,
} from './resolve-app-gate';
import { resolveUnauthenticatedAppGate } from './resolve-unauthenticated-app-gate';

const completeProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Test',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: null,
  neckCm: null,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const incompleteProfile: UserProfile = {
  ...completeProfile,
  dateOfBirth: null,
  heightCm: null,
  weightKg: null,
  gender: null,
  activityLevel: null,
};

function gateDeps(input: {
  profile?: UserProfile | null;
  profileError?: boolean;
  cachedComplete?: boolean | null;
}): AuthenticatedOnboardingGateDeps & { cachedWrites: boolean[] } {
  const cachedWrites: boolean[] = [];
  return {
    cachedWrites,
    getCurrentProfile: async () =>
      input.profileError
        ? { ok: false, error: { code: 'NETWORK', message: 'unavailable' } }
        : { ok: true, value: input.profile === undefined ? null : input.profile },
    setOnboardingCompleteForUser: async (_userId, complete) => {
      cachedWrites.push(complete);
    },
    getOnboardingCompleteForUser: async () => input.cachedComplete ?? null,
  };
}

describe('resolveAuthenticatedOnboardingGate', () => {
  it('sends an authenticated incomplete or missing profile to step-4', async () => {
    assert.equal(
      await resolveAuthenticatedOnboardingGate('user-1', gateDeps({ profile: null })),
      'onboarding-step-4',
    );
    assert.equal(
      await resolveAuthenticatedOnboardingGate('user-1', gateDeps({ profile: incompleteProfile })),
      'onboarding-step-4',
    );
  });

  it('sends an authenticated complete profile home', async () => {
    const deps = gateDeps({ profile: completeProfile });
    assert.equal(await resolveAuthenticatedOnboardingGate('user-1', deps), 'home');
    assert.deepEqual(deps.cachedWrites, [true]);
  });

  it('preserves home when profile fetch fails and the cache is complete', async () => {
    assert.equal(
      await resolveAuthenticatedOnboardingGate(
        'user-1',
        gateDeps({ profileError: true, cachedComplete: true }),
      ),
      'home',
    );
  });

  it('resumes at step-4 when profile fetch fails and there is no complete cache', async () => {
    assert.equal(
      await resolveAuthenticatedOnboardingGate(
        'user-1',
        gateDeps({ profileError: true, cachedComplete: null }),
      ),
      'onboarding-step-4',
    );
    assert.equal(
      await resolveAuthenticatedOnboardingGate(
        'user-1',
        gateDeps({ profileError: true, cachedComplete: false }),
      ),
      'onboarding-step-4',
    );
  });

  it('never resolves an authenticated user to the anonymous onboarding intro', async () => {
    const cases = [
      gateDeps({ profile: null }),
      gateDeps({ profile: incompleteProfile }),
      gateDeps({ profile: completeProfile }),
      gateDeps({ profileError: true, cachedComplete: true }),
      gateDeps({ profileError: true, cachedComplete: null }),
    ];

    for (const deps of cases) {
      const destination = await resolveAuthenticatedOnboardingGate('user-1', deps);
      assert.notEqual(destination, 'onboarding');
    }
  });
});

describe('resolveAppGate authenticated resume after consent', () => {
  it('sends a completed authenticated profile without current consent to the consent screen', async () => {
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: false } }),
      hasActiveCurrentConsent: async () => false,
      authenticatedOnboardingGateDeps: gateDeps({ profile: completeProfile }),
    });

    assert.deepEqual(result, { destination: 'authenticated-health-data-consent' });
    assert.notEqual(result.destination, 'onboarding');
    assert.notEqual(result.destination, 'home');
    assert.notEqual(result.destination, 'onboarding-step-4');
  });

  it('sends a completed authenticated profile with current consent home', async () => {
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: true } }),
      hasActiveCurrentConsent: async () => true,
      authenticatedOnboardingGateDeps: gateDeps({ profile: completeProfile }),
    });

    assert.deepEqual(result, { destination: 'home' });
    assert.notEqual(result.destination, 'onboarding');
  });

  it('goes home after accept when persist then read reports active current consent', async () => {
    let active = false;
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => {
        active = true;
        return { ok: true, value: { persisted: true } };
      },
      hasActiveCurrentConsent: async () => active,
      authenticatedOnboardingGateDeps: gateDeps({ profile: completeProfile }),
    });

    assert.deepEqual(result, { destination: 'home' });
  });

  it('stays on consent when persist fails and the authoritative read is still inactive', async () => {
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({
        ok: false,
        error: { code: 'INTEGRATION', message: 'insert failed' },
      }),
      hasActiveCurrentConsent: async () => false,
      authenticatedOnboardingGateDeps: gateDeps({ profile: completeProfile }),
    });

    assert.deepEqual(result, { destination: 'authenticated-health-data-consent' });
    assert.notEqual(result.destination, 'onboarding');
  });

  it('sends an incomplete authenticated profile without current consent to the interstitial first', async () => {
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: false } }),
      hasActiveCurrentConsent: async () => false,
      authenticatedOnboardingGateDeps: gateDeps({ profile: incompleteProfile }),
    });

    assert.deepEqual(result, { destination: 'authenticated-health-data-consent' });
    assert.notEqual(result.destination, 'onboarding');
    assert.notEqual(result.destination, 'onboarding-step-4');
  });

  it('resumes at step-4 after consent persist when the profile is incomplete', async () => {
    const result = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: true } }),
      hasActiveCurrentConsent: async () => true,
      authenticatedOnboardingGateDeps: gateDeps({ profile: incompleteProfile }),
    });

    assert.deepEqual(result, { destination: 'onboarding-step-4' });
    assert.notEqual(result.destination, 'onboarding');
  });

  it('never sends an authenticated user to intro after consent accept', async () => {
    const complete = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: true } }),
      hasActiveCurrentConsent: async () => true,
      authenticatedOnboardingGateDeps: gateDeps({ profile: completeProfile }),
    });
    const incomplete = await resolveAppGate({
      isReady: true,
      isAuthenticated: true,
      userId: 'user-1',
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: true } }),
      hasActiveCurrentConsent: async () => true,
      authenticatedOnboardingGateDeps: gateDeps({ profile: incompleteProfile }),
    });

    assert.notEqual(complete.destination, 'onboarding');
    assert.notEqual(incomplete.destination, 'onboarding');
    assert.deepEqual(complete, { destination: 'home' });
    assert.deepEqual(incomplete, { destination: 'onboarding-step-4' });
  });

  it('keeps unauthenticated onboarding intro unchanged', async () => {
    assert.deepEqual(
      await resolveAppGate({
        isReady: true,
        isAuthenticated: false,
        userId: null,
        getPendingSignupVerification: async () => null,
      }),
      { destination: 'onboarding' },
    );
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );
  });
});
