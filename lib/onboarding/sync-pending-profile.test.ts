import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../core';
import type { ProfileMeasurements, UserProfile } from '../domain/profile';
import {
  runSyncPendingProfile,
  type SyncPendingProfileDeps,
} from './sync-pending-profile';

const completeProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Test',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const pending: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  activityLevel: 'moderately_active',
};

function createDeps(input: {
  pending: ProfileMeasurements | null;
  existingProfile?: UserProfile | null;
  pendingOwnerId?: string;
  currentUserId?: string;
}): {
  deps: SyncPendingProfileDeps;
  snapshots: number;
  lastHipCm: number | null;
  pendingAfter: () => ProfileMeasurements | null;
} {
  let pendingState = input.pending;
  let snapshots = 0;
  let lastHipCm: number | null = null;
  const pendingOwnerId = input.pendingOwnerId ?? 'user-1';
  const currentUserId = input.currentUserId ?? 'user-1';

  const deps: SyncPendingProfileDeps = {
    getCurrentUser: async () => ({ ok: true, value: { id: currentUserId } }),
    getPendingProfileMeasurements: async (userId) =>
      userId === pendingOwnerId ? pendingState : null,
    clearPendingProfileMeasurements: async (userId) => {
      if (userId === pendingOwnerId) {
        pendingState = null;
      }
    },
    completeOnboarding: async () => ({ ok: true, value: completeProfile }),
    getCurrentProfile: async () => ({
      ok: true,
      value: input.existingProfile === undefined ? completeProfile : input.existingProfile,
    }),
    createOnboardingSnapshot: async (_profile, options) => {
      snapshots += 1;
      lastHipCm = options?.hipCm ?? null;
      return { ok: true, value: { id: `snap-${snapshots}` } };
    },
    setOnboardingCompleteForUser: async () => undefined,
  };

  return {
    deps,
    get snapshots() {
      return snapshots;
    },
    get lastHipCm() {
      return lastHipCm;
    },
    pendingAfter: () => pendingState,
  };
}

describe('syncPendingProfileAfterAuth — snapshot idempotency', () => {
  it('creates an onboarding snapshot only when pending profile data is persisted', async () => {
    const harness = createDeps({ pending });
    const result = await runSyncPendingProfile(harness.deps);

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.persistedPending, true);
      assert.equal(result.snapshotCreated, true);
    }
    assert.equal(harness.snapshots, 1);
    assert.equal(harness.lastHipCm, null);
    assert.equal(harness.pendingAfter(), null);
  });

  it('passes pending hip into the onboarding snapshot and does not invent hip when skipped', async () => {
    const harness = createDeps({ pending: { ...pending, hipCm: 98 } });
    const result = await runSyncPendingProfile(harness.deps);
    assert.equal(result.ok, true);
    assert.equal(harness.lastHipCm, 98);
  });

  it('does not create another onboarding snapshot when pending is already gone', async () => {
    const harness = createDeps({ pending: null, existingProfile: completeProfile });
    const result = await runSyncPendingProfile(harness.deps);

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.persistedPending, false);
      assert.equal(result.snapshotCreated, false);
    }
    assert.equal(harness.snapshots, 0);
  });

  it('does not create another onboarding snapshot on a later sign-in after pending was already persisted', async () => {
    const harness = createDeps({ pending });
    const first = await runSyncPendingProfile(harness.deps);
    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.snapshotCreated, true);
    }
    assert.equal(harness.snapshots, 1);

    const second = await runSyncPendingProfile(harness.deps);
    assert.equal(second.ok, true);
    if (second.ok) {
      assert.equal(second.persistedPending, false);
      assert.equal(second.snapshotCreated, false);
    }
    assert.equal(harness.snapshots, 1);
  });

  it('keeps pending profile data when the user is not authenticated yet', async () => {
    const harness = createDeps({ pending });
    harness.deps.getCurrentUser = async (): Promise<Result<{ id: string } | null>> => ({
      ok: true,
      value: null,
    });

    const result = await runSyncPendingProfile(harness.deps);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'unauthenticated');
    }
    assert.deepEqual(harness.pendingAfter(), pending);
    assert.equal(harness.snapshots, 0);
  });

  it('never persists User A pending profile to User B', async () => {
    const harness = createDeps({
      pending,
      pendingOwnerId: 'user-a',
      currentUserId: 'user-b',
      existingProfile: null,
    });
    let completeCalls = 0;
    harness.deps.completeOnboarding = async () => {
      completeCalls += 1;
      return { ok: true, value: completeProfile };
    };

    const result = await runSyncPendingProfile(harness.deps);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'missing_pending');
    }
    assert.equal(completeCalls, 0);
    assert.deepEqual(harness.pendingAfter(), pending);
    assert.equal(harness.snapshots, 0);
  });

  it('preserves User A pending profile after a failed save for a later retry', async () => {
    const harness = createDeps({ pending });
    harness.deps.completeOnboarding = async () => ({
      ok: false,
      error: { code: 'NETWORK', message: 'safe failure' },
    });

    const failed = await runSyncPendingProfile(harness.deps);
    assert.equal(failed.ok, false);
    assert.deepEqual(harness.pendingAfter(), pending);
    assert.equal(harness.snapshots, 0);

    harness.deps.completeOnboarding = async () => ({ ok: true, value: completeProfile });
    const retried = await runSyncPendingProfile(harness.deps);
    assert.equal(retried.ok, true);
    assert.equal(harness.pendingAfter(), null);
    assert.equal(harness.snapshots, 1);
  });
});
