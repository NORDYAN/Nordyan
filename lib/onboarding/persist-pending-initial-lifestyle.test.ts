import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../core';
import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';
import {
  createMemoryPendingKeyValueStore,
  createPendingInitialLifestyleStore,
} from './pending-initial-lifestyle-store';
import { persistPendingInitialLifestyle } from './persist-pending-initial-lifestyle';

const answers: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

describe('persistPendingInitialLifestyle', () => {
  it('does nothing when no pending lifestyle exists', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    const saves: unknown[] = [];
    const snapshots: unknown[] = [];

    const result = await persistPendingInitialLifestyle('user-1', {
      getPendingInitialLifestyle: (userId) =>
        pending.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        pending.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async (userId, payload) => {
        saves.push({ userId, payload });
        return { ok: true, value: payload };
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.persisted, false);
    }
    assert.equal(saves.length, 0);
    assert.equal(snapshots.length, 0);
  });

  it('saves valid pending lifestyle for the authenticated user and clears pending', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-1');
    const saves: Array<{ userId: string; payload: InitialLifestyleAnswers }> = [];

    const result = await persistPendingInitialLifestyle('user-1', {
      getPendingInitialLifestyle: (userId) =>
        pending.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        pending.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async (userId, payload) => {
        saves.push({ userId, payload });
        return { ok: true, value: payload };
      },
    });

    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.value.persisted, true);
    }
    assert.deepEqual(saves, [{ userId: 'user-1', payload: answers }]);
    const loaded = await pending.getPendingInitialLifestyleForUser('user-1');
    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.equal(loaded.value, null);
    }
  });

  it('preserves pending when server save fails', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-1');
    const failure: Result<unknown> = {
      ok: false,
      error: { code: 'NETWORK', message: 'Kunde inte spara din livsstilskoll. Försök igen.' },
    };

    const result = await persistPendingInitialLifestyle('user-1', {
      getPendingInitialLifestyle: (userId) =>
        pending.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        pending.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async () => failure,
    });

    assert.equal(result.ok, false);
    const loaded = await pending.getPendingInitialLifestyleForUser('user-1');
    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.deepEqual(loaded.value, answers);
    }
  });

  it('persists pending Initial Lifestyle only once', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-1');
    const saves: unknown[] = [];
    const deps = {
      getPendingInitialLifestyle: (userId: string) =>
        pending.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId: string) =>
        pending.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async (userId: string, payload: InitialLifestyleAnswers) => {
        saves.push({ userId, payload });
        return { ok: true as const, value: payload };
      },
    };

    const first = await persistPendingInitialLifestyle('user-1', deps);
    const second = await persistPendingInitialLifestyle('user-1', deps);

    assert.equal(first.ok, true);
    if (first.ok) {
      assert.equal(first.value.persisted, true);
    }
    assert.equal(second.ok, true);
    if (second.ok) {
      assert.equal(second.value.persisted, false);
    }
    assert.equal(saves.length, 1);
  });

  it('does not invoke Health Score, Focus, Coach, or snapshot callbacks', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-1');
    let snapshotCalls = 0;
    let healthScoreCalls = 0;
    let focusCalls = 0;
    let coachCalls = 0;

    const result = await persistPendingInitialLifestyle('user-1', {
      getPendingInitialLifestyle: (userId) =>
        pending.getPendingInitialLifestyleForUser(userId),
      clearPendingInitialLifestyle: (userId) =>
        pending.clearPendingInitialLifestyleForUser(userId),
      saveInitialLifestyle: async (_userId, payload) => {
        return { ok: true, value: payload };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(snapshotCalls, 0);
    assert.equal(healthScoreCalls, 0);
    assert.equal(focusCalls, 0);
    assert.equal(coachCalls, 0);
  });
});
