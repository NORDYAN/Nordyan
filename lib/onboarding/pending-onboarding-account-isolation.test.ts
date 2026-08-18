import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';
import type { ProfileMeasurements } from '../domain/profile';
import {
  createPendingInitialLifestyleStore,
} from './pending-initial-lifestyle-store';
import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  bindPendingOnboardingOwnership,
  clearCompletedOnboardingLocalData,
  clearUnownedPendingOnboarding,
  type ClearCompletedOnboardingLocalDataDeps,
  type PendingOnboardingOwnershipDeps,
} from './pending-onboarding-ownership.service';
import { persistPendingInitialLifestyle } from './persist-pending-initial-lifestyle';
import { createPendingProfileStore } from './pending-profile-store';
import { runSyncPendingProfile } from './sync-pending-profile';

const profile: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
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
  const deps: PendingOnboardingOwnershipDeps = {
    getProfileBindState: (userId) => pendingProfile.getBindState(userId),
    getLifestyleBindState: (userId) => pendingLifestyle.getBindState(userId),
    bindProfile: (userId) => pendingProfile.bindToUser(userId),
    bindLifestyle: (userId) =>
      pendingLifestyle.bindPendingInitialLifestyleToUser(userId),
    releaseProfileBinding: (userId) => pendingProfile.releaseBinding(userId),
    clearUnownedProfile: () => pendingProfile.clearUnowned(),
    clearUnownedLifestyle: () =>
      pendingLifestyle.clearUnownedPendingInitialLifestyle(),
  };

  const cleanupDeps: ClearCompletedOnboardingLocalDataDeps = {
    ...deps,
    clearProfileForUser: (userId) => pendingProfile.clearForUser(userId),
    clearLifestyleForUser: (userId) =>
      pendingLifestyle.clearPendingInitialLifestyleForUser(userId),
  };

  return { pendingProfile, pendingLifestyle, deps, cleanupDeps };
}

describe('pending onboarding two-account isolation', () => {
  it('binds User A signup bundle and never exposes or rebinds it to User B', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-a', harness.deps),
      { ok: true, bound: true },
    );
    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-b', harness.deps),
      { ok: true, bound: false },
    );

    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-b'),
      { ok: true, value: null },
    );
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
  });

  it('keeps failed User A retry data isolated through User B account switching', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    await clearUnownedPendingOnboarding(harness.deps);

    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-b'),
      { ok: true, value: null },
    );
  });

  it('binds a new anonymous User B draft while preserving User A retry data', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    const profileB = { ...profile, heightCm: 174, weightKg: 72 };
    const lifestyleB = { ...lifestyle, energy: 2 as const };
    await harness.pendingProfile.saveUnowned(profileB);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyleB);

    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-b', harness.deps),
      { ok: true, bound: true },
    );
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-b'), profileB);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-b'),
      { ok: true, value: lifestyleB },
    );

    await clearCompletedOnboardingLocalData('user-b', harness.cleanupDeps);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
  });

  it('fails closed instead of merging a new anonymous draft into the same UUID retry', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    const anonymous = { ...profile, heightCm: 174, weightKg: 72 };
    await harness.pendingProfile.saveUnowned(anonymous);
    await harness.pendingLifestyle.savePendingInitialLifestyle({
      ...lifestyle,
      energy: 2,
    });

    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-a', harness.deps),
      { ok: false, reason: 'ownership_mismatch' },
    );
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(await harness.pendingProfile.getUnowned(), anonymous);
  });

  it('clears unowned failed-signup data before an existing account sign-in', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    await clearUnownedPendingOnboarding(harness.deps);

    assert.equal(await harness.pendingProfile.getUnowned(), null);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyle(),
      { ok: true, value: null },
    );
  });

  it('clears an unowned partial value instead of assigning it across accounts', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await harness.pendingProfile.bindToUser('user-a');

    await clearUnownedPendingOnboarding(harness.deps);

    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: null,
    });
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: null },
    );
  });

  it('rolls back a new profile binding when the lifestyle binding write fails', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    harness.deps.bindLifestyle = async () => {
      throw new Error('storage unavailable');
    };

    await assert.rejects(
      bindPendingOnboardingOwnership('user-a', harness.deps),
      /storage unavailable/,
    );
    assert.deepEqual(await harness.pendingProfile.getUnowned(), profile);
    assert.equal(await harness.pendingProfile.getForUser('user-a'), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: lifestyle,
    });
  });

  it('binds current-session unowned onboarding data to the authenticated user at persist time', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-a', harness.deps),
      { ok: true, bound: true },
    );
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.equal(await harness.pendingProfile.getUnowned(), null);
    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-a', harness.deps),
      { ok: true, bound: false },
    );
  });

  it('does not claim another user retry when the current user has no draft', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    assert.deepEqual(
      await bindPendingOnboardingOwnership('user-b', harness.deps),
      { ok: true, bound: false },
    );
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
  });

  it('persists the bound bundle exactly once after verification', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    const completeProfile = {
      id: 'profile-1',
      userId: 'user-a',
      firstName: null,
      dateOfBirth: profile.dateOfBirth ?? '1980-01-01',
      gender: profile.gender ?? 'male',
      heightCm: profile.heightCm,
      weightKg: profile.weightKg ?? 80,
      waistCm: profile.waistCm ?? null,
      neckCm: profile.neckCm ?? null,
      activityLevel: profile.activityLevel ?? 'moderately_active',
      goal: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    let snapshots = 0;
    let lifestyleSaves = 0;

    const firstProfile = await runSyncPendingProfile({
      getCurrentUser: async () => ({ ok: true, value: { id: 'user-a' } }),
      getPendingProfileMeasurements: (userId) => harness.pendingProfile.getForUser(userId),
      clearPendingProfileMeasurements: (userId) => harness.pendingProfile.clearForUser(userId),
      completeOnboarding: async () => ({ ok: true, value: completeProfile }),
      getCurrentProfile: async () => ({ ok: true, value: completeProfile }),
      createOnboardingSnapshot: async () => {
        snapshots += 1;
        return { ok: true, value: { id: `snap-${snapshots}` } };
      },
      setOnboardingCompleteForUser: async () => undefined,
    });
    const firstLifestyle = await persistPendingInitialLifestyle('user-a', {
      getPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async () => {
        lifestyleSaves += 1;
        return { ok: true, value: lifestyle };
      },
    });

    assert.equal(firstProfile.ok, true);
    if (firstProfile.ok) {
      assert.equal(firstProfile.persistedPending, true);
      assert.equal(firstProfile.snapshotCreated, true);
    }
    assert.equal(firstLifestyle.ok, true);
    if (firstLifestyle.ok) {
      assert.equal(firstLifestyle.value.persisted, true);
    }

    const secondProfile = await runSyncPendingProfile({
      getCurrentUser: async () => ({ ok: true, value: { id: 'user-a' } }),
      getPendingProfileMeasurements: (userId) => harness.pendingProfile.getForUser(userId),
      clearPendingProfileMeasurements: (userId) => harness.pendingProfile.clearForUser(userId),
      completeOnboarding: async () => ({ ok: true, value: completeProfile }),
      getCurrentProfile: async () => ({ ok: true, value: completeProfile }),
      createOnboardingSnapshot: async () => {
        snapshots += 1;
        return { ok: true, value: { id: `snap-${snapshots}` } };
      },
      setOnboardingCompleteForUser: async () => undefined,
    });
    const secondLifestyle = await persistPendingInitialLifestyle('user-a', {
      getPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async () => {
        lifestyleSaves += 1;
        return { ok: true, value: lifestyle };
      },
    });

    assert.equal(secondProfile.ok, true);
    if (secondProfile.ok) {
      assert.equal(secondProfile.persistedPending, false);
      assert.equal(secondProfile.snapshotCreated, false);
    }
    assert.equal(secondLifestyle.ok, true);
    if (secondLifestyle.ok) {
      assert.equal(secondLifestyle.value.persisted, false);
    }
    assert.equal(snapshots, 1);
    assert.equal(lifestyleSaves, 1);
    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
  });

  it('clears leftover unowned 150/50 after persist succeeds via an already-complete profile', async () => {
    const harness = createHarness();
    const stale: ProfileMeasurements = {
      ...profile,
      gender: 'female',
      heightCm: 150,
      weightKg: 50,
    };
    await harness.pendingProfile.saveUnowned(stale);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    const completeProfile = {
      id: 'profile-1',
      userId: 'user-a',
      firstName: null,
      dateOfBirth: stale.dateOfBirth ?? '1980-01-01',
      gender: stale.gender ?? 'female',
      heightCm: stale.heightCm,
      weightKg: stale.weightKg ?? 50,
      waistCm: stale.waistCm ?? null,
      neckCm: stale.neckCm ?? null,
      activityLevel: stale.activityLevel ?? 'moderately_active',
      goal: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    const profileResult = await runSyncPendingProfile({
      getCurrentUser: async () => ({ ok: true, value: { id: 'user-a' } }),
      getPendingProfileMeasurements: (userId) => harness.pendingProfile.getForUser(userId),
      clearPendingProfileMeasurements: (userId) => harness.pendingProfile.clearForUser(userId),
      completeOnboarding: async () => ({ ok: true, value: completeProfile }),
      getCurrentProfile: async () => ({ ok: true, value: completeProfile }),
      createOnboardingSnapshot: async () => ({ ok: true, value: { id: 'snap-1' } }),
      setOnboardingCompleteForUser: async () => undefined,
    });
    const lifestyleResult = await persistPendingInitialLifestyle('user-a', {
      getPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        harness.pendingLifestyle.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async () => ({ ok: true, value: lifestyle }),
    });

    assert.equal(profileResult.ok, true);
    if (profileResult.ok) {
      assert.equal(profileResult.persistedPending, false);
    }
    assert.equal(lifestyleResult.ok, true);
    if (lifestyleResult.ok) {
      assert.equal(lifestyleResult.value.persisted, false);
    }
    assert.deepEqual(await harness.pendingProfile.getUnowned(), stale);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: lifestyle,
    });

    await clearCompletedOnboardingLocalData('user-a', harness.cleanupDeps);

    assert.equal(await harness.pendingProfile.getUnowned(), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: null,
    });
    assert.equal(await harness.pendingProfile.getForUser('user-a'), null);
  });

  it('retains bound retry data when persistence only partially succeeds', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    const profileResult = await runSyncPendingProfile({
      getCurrentUser: async () => ({ ok: true, value: { id: 'user-a' } }),
      getPendingProfileMeasurements: (userId) => harness.pendingProfile.getForUser(userId),
      clearPendingProfileMeasurements: (userId) => harness.pendingProfile.clearForUser(userId),
      completeOnboarding: async () => ({
        ok: false,
        error: { code: 'NETWORK', message: 'Det gick inte att spara din profil. Försök igen.' },
      }),
      getCurrentProfile: async () => ({ ok: true, value: null }),
      createOnboardingSnapshot: async () => {
        throw new Error('must not snapshot');
      },
      setOnboardingCompleteForUser: async () => undefined,
    });

    assert.equal(profileResult.ok, false);
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
  });

  it('does not clear User A bound retry data when User B completed cleanup runs', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    await clearCompletedOnboardingLocalData('user-b', harness.cleanupDeps);

    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
    assert.equal(await harness.pendingProfile.getForUser('user-b'), null);
    assert.equal(await harness.pendingProfile.getUnowned(), null);
  });

  it('clears a new anonymous attempt without dropping another UUID bound retry bundle', async () => {
    const harness = createHarness();
    await harness.pendingProfile.saveUnowned(profile);
    await harness.pendingLifestyle.savePendingInitialLifestyle(lifestyle);
    await bindPendingOnboardingOwnership('user-a', harness.deps);

    const nextAnonymousProfile = { ...profile, heightCm: 150, weightKg: 50 };
    await harness.pendingProfile.saveUnowned(nextAnonymousProfile);
    await harness.pendingLifestyle.savePendingInitialLifestyle({
      ...lifestyle,
      energy: lifestyle.energy === 5 ? 4 : 5,
    });
    assert.deepEqual(await harness.pendingProfile.getUnowned(), nextAnonymousProfile);

    await clearUnownedPendingOnboarding(harness.deps);

    assert.equal(await harness.pendingProfile.getUnowned(), null);
    assert.deepEqual(await harness.pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: null,
    });
    assert.deepEqual(await harness.pendingProfile.getForUser('user-a'), profile);
    assert.deepEqual(
      await harness.pendingLifestyle.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: lifestyle },
    );
  });
});
