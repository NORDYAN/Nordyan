import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';
import type { ProfileMeasurements } from '../domain/profile';
import { hasRequiredAnonymousSignupBaseline } from './anonymous-signup-baseline';
import { completeAuthEmailCallback } from '../presentation/auth-verification/complete-auth-email-callback';
import { createPendingAgeConfirmationStore } from './pending-age-confirmation-store';
import {
  createCurrentHealthDataConsentGrant,
  createPendingHealthDataConsentStore,
} from './pending-health-data-consent-store';
import { createPendingInitialLifestyleStore } from './pending-initial-lifestyle-store';
import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  bindPendingOnboardingOwnership,
  releasePendingOnboardingFromOwner,
  type PendingOnboardingOwnershipDeps,
  type ReleasePendingOnboardingDeps,
} from './pending-onboarding-ownership.service';
import { createPendingProfileStore } from './pending-profile-store';
import { persistPendingInitialLifestyle } from './persist-pending-initial-lifestyle';
import { createPendingSignupVerificationStore } from './pending-signup-verification';
import { resolveUnauthenticatedAppGate } from './resolve-unauthenticated-app-gate';
import { runSyncPendingProfile } from './sync-pending-profile';

const typoOwnerId = 'typo-owner';
const correctedOwnerId = 'corrected-owner';

const profile: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'female',
  heightCm: 168,
  weightKg: 62,
  waistCm: 74,
  neckCm: 32,
  hipCm: 96,
  activityLevel: 'moderately_active',
};

const lifestyle: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

function createHarness() {
  const storage = createMemoryPendingKeyValueStore();
  const pendingProfile = createPendingProfileStore(storage);
  const pendingLifestyle = createPendingInitialLifestyleStore(storage);
  const pendingAge = createPendingAgeConfirmationStore(storage);
  const pendingConsent = createPendingHealthDataConsentStore(storage);
  const pendingWait = createPendingSignupVerificationStore(storage);
  const bindDeps: PendingOnboardingOwnershipDeps = {
    getProfileBindState: (userId) => pendingProfile.getBindState(userId),
    getLifestyleBindState: (userId) => pendingLifestyle.getBindState(userId),
    bindProfile: (userId) => pendingProfile.bindToUser(userId),
    bindLifestyle: (userId) => pendingLifestyle.bindPendingInitialLifestyleToUser(userId),
    releaseProfileBinding: (userId) => pendingProfile.releaseBinding(userId),
    clearUnownedProfile: () => pendingProfile.clearUnowned(),
    clearUnownedLifestyle: () => pendingLifestyle.clearUnownedPendingInitialLifestyle(),
  };
  const releaseDeps: ReleasePendingOnboardingDeps = {
    releaseProfileBinding: (userId) => pendingProfile.releaseBinding(userId),
    releaseLifestyleBinding: (userId) => pendingLifestyle.releaseBinding(userId),
  };

  return {
    pendingProfile,
    pendingLifestyle,
    pendingAge,
    pendingConsent,
    pendingWait,
    bindDeps,
    releaseDeps,
  };
}

async function completeOnboardingThenTypoSignup(
  harness: ReturnType<typeof createHarness>,
) {
  await harness.pendingAge.saveConfirmed18Plus();
  await harness.pendingConsent.savePendingHealthDataConsent(
    createCurrentHealthDataConsentGrant('2026-08-01T12:00:00.000Z'),
  );
  await harness.pendingProfile.saveUnowned(profile);
  await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

  assert.deepEqual(await bindPendingOnboardingOwnership(typoOwnerId, harness.bindDeps), {
    ok: true,
    bound: true,
  });
  await harness.pendingWait.save({
    email: 'typo@nordyan.se',
    ownerId: typoOwnerId,
  });
}

describe('wrong signup email recovery', () => {
  it('binds completed onboarding to the typo owner and keeps a wait record', async () => {
    const harness = createHarness();
    await completeOnboardingThenTypoSignup(harness);

    assert.deepEqual(await harness.pendingProfile.getForUser(typoOwnerId), profile);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyleForUser(typoOwnerId), {
      ok: true,
      value: lifestyle,
    });
    assert.equal(await harness.pendingProfile.getUnowned(), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: null,
    });
    assert.deepEqual(await harness.pendingWait.get(), {
      email: 'typo@nordyan.se',
      ownerId: typoOwnerId,
    });
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: 'typo@nordyan.se',
      }),
      { destination: 'check-email', email: 'typo@nordyan.se' },
    );
  });

  it('releases profile and Initial Lifestyle to anonymous with identical values and preserves age plus consent', async () => {
    const harness = createHarness();
    await completeOnboardingThenTypoSignup(harness);
    const consentBefore = await harness.pendingConsent.getPendingHealthDataConsent();

    assert.equal(
      await hasRequiredAnonymousSignupBaseline({
        getUnownedPendingInitialLifestyle: () => harness.pendingLifestyle.getPendingInitialLifestyle(),
        hasPendingAgeConfirmation: () => harness.pendingAge.hasConfirmed18Plus(),
        getUnownedPendingHealthDataConsent: () => harness.pendingConsent.getPendingHealthDataConsent(),
        getUnownedPendingProfileMeasurements: () => harness.pendingProfile.getUnowned(),
      }),
      false,
    );

    await releasePendingOnboardingFromOwner(typoOwnerId, harness.releaseDeps);
    await harness.pendingWait.clear();

    assert.deepEqual(await harness.pendingProfile.getUnowned(), profile);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: lifestyle,
    });
    assert.equal(await harness.pendingProfile.getForUser(typoOwnerId), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyleForUser(typoOwnerId), {
      ok: true,
      value: null,
    });
    assert.equal(await harness.pendingWait.get(), null);
    assert.equal(await harness.pendingAge.hasConfirmed18Plus(), true);
    assert.deepEqual(await harness.pendingConsent.getPendingHealthDataConsent(), consentBefore);
    assert.equal(
      await hasRequiredAnonymousSignupBaseline({
        getUnownedPendingInitialLifestyle: () => harness.pendingLifestyle.getPendingInitialLifestyle(),
        hasPendingAgeConfirmation: () => harness.pendingAge.hasConfirmed18Plus(),
        getUnownedPendingHealthDataConsent: () => harness.pendingConsent.getPendingHealthDataConsent(),
        getUnownedPendingProfileMeasurements: () => harness.pendingProfile.getUnowned(),
      }),
      true,
    );
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );
  });

  it('does not silently merge pending health data belonging to different ownerIds', async () => {
    const harness = createHarness();
    await completeOnboardingThenTypoSignup(harness);

    const foreignProfile = { ...profile, heightCm: 150, weightKg: 50 };
    const foreignLifestyle = { ...lifestyle, energy: 1 as const };
    await harness.pendingProfile.saveUnowned(foreignProfile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(foreignLifestyle);

    assert.deepEqual(await bindPendingOnboardingOwnership(typoOwnerId, harness.bindDeps), {
      ok: false,
      reason: 'ownership_mismatch',
    });
    await assert.rejects(
      releasePendingOnboardingFromOwner(typoOwnerId, harness.releaseDeps),
      /cannot release a bound profile over an anonymous draft/,
    );

    assert.deepEqual(await harness.pendingProfile.getForUser(typoOwnerId), profile);
    assert.deepEqual(await harness.pendingProfile.getUnowned(), foreignProfile);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyleForUser(typoOwnerId), {
      ok: true,
      value: lifestyle,
    });
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: foreignLifestyle,
    });
  });

  it('binds the same anonymous bundle to a new owner and creates a new wait record', async () => {
    const harness = createHarness();
    await completeOnboardingThenTypoSignup(harness);
    await releasePendingOnboardingFromOwner(typoOwnerId, harness.releaseDeps);
    await harness.pendingWait.clear();

    assert.deepEqual(
      await bindPendingOnboardingOwnership(correctedOwnerId, harness.bindDeps),
      { ok: true, bound: true },
    );
    await harness.pendingWait.save({
      email: 'correct@nordyan.se',
      ownerId: correctedOwnerId,
    });

    assert.deepEqual(await harness.pendingProfile.getForUser(correctedOwnerId), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser(correctedOwnerId),
      { ok: true, value: lifestyle },
    );
    assert.equal(await harness.pendingProfile.getForUser(typoOwnerId), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyleForUser(typoOwnerId), {
      ok: true,
      value: null,
    });
    assert.deepEqual(await harness.pendingWait.get(), {
      email: 'correct@nordyan.se',
      ownerId: correctedOwnerId,
    });
  });

  it('persists the released bundle to the corrected user on verification, not the typo owner', async () => {
    const harness = createHarness();
    await completeOnboardingThenTypoSignup(harness);
    await releasePendingOnboardingFromOwner(typoOwnerId, harness.releaseDeps);
    await harness.pendingWait.clear();
    await bindPendingOnboardingOwnership(correctedOwnerId, harness.bindDeps);

    const persistedProfiles: string[] = [];
    const persistedLifestyles: string[] = [];
    const session = {
      user: { id: correctedOwnerId, email: 'correct@nordyan.se' },
      accessToken: 'token',
      expiresAt: null,
    };
    const completeProfile = {
      id: 'profile-corrected',
      userId: correctedOwnerId,
      firstName: null,
      dateOfBirth: profile.dateOfBirth ?? '1980-01-01',
      gender: profile.gender ?? 'female',
      heightCm: profile.heightCm,
      weightKg: profile.weightKg ?? 62,
      waistCm: profile.waistCm ?? null,
      neckCm: profile.neckCm ?? null,
      activityLevel: profile.activityLevel ?? 'moderately_active',
      goal: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => ({ ok: true, value: session }),
      syncPendingProfile: async () =>
        runSyncPendingProfile({
          getCurrentUser: async () => ({ ok: true, value: { id: correctedOwnerId } }),
          getPendingProfileMeasurements: (userId) => harness.pendingProfile.getForUser(userId),
          clearPendingProfileMeasurements: (userId) => harness.pendingProfile.clearForUser(userId),
          completeOnboarding: async () => {
            persistedProfiles.push(correctedOwnerId);
            return { ok: true, value: completeProfile };
          },
          getCurrentProfile: async () => ({ ok: true, value: completeProfile }),
          createOnboardingSnapshot: async () => ({ ok: true, value: { id: 'snap-1' } }),
          setOnboardingCompleteForUser: async () => undefined,
        }),
      persistPendingLifestyle: async (userId) => {
        persistedLifestyles.push(userId);
        return persistPendingInitialLifestyle(userId, {
          getPendingInitialLifestyle: (id) =>
            harness.pendingLifestyle.getPendingInitialLifestyleForUser(id),
          clearPendingInitialLifestyle: (id) =>
            harness.pendingLifestyle.clearPendingInitialLifestyleForUser(id),
          saveInitialLifestyle: async () => ({ ok: true, value: lifestyle }),
        });
      },
      clearCompletedOnboardingLocalData: async () => undefined,
    });

    assert.equal(result.ok, true);
    assert.deepEqual(persistedProfiles, [correctedOwnerId]);
    assert.deepEqual(persistedLifestyles, [correctedOwnerId]);
    assert.equal(await harness.pendingProfile.getForUser(typoOwnerId), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyleForUser(typoOwnerId), {
      ok: true,
      value: null,
    });
    assert.equal(await harness.pendingProfile.getForUser(correctedOwnerId), null);
  });
});
