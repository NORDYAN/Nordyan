import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '../domain/initial-lifestyle';

import {
  INITIAL_LIFESTYLE_PENDING_ALLOWED_KEYS,
  PENDING_INITIAL_LIFESTYLE_KEY,
  createMemoryPendingKeyValueStore,
  createPendingInitialLifestyleStore,
  pendingInitialLifestylePersistedKeys,
} from './pending-initial-lifestyle-store';

const answers: InitialLifestyleAnswers = {
  sleepQuality: 3,
  energy: 4,
  stress: 2,
  lessHealthyFoodFrequency: 'two_three',
  everydayActivity: 3,
  eatingQuality: 4,
  alcoholConsumption: '1_3',
};

describe('pending Initial Lifestyle storage', () => {
  it('stores and retrieves valid complete answers', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);

    const saved = await pending.savePendingInitialLifestyle(answers);
    const loaded = await pending.getPendingInitialLifestyle();

    assert.equal(saved.ok, true);
    if (saved.ok) {
      assert.deepEqual(saved.value, answers);
    }
    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.deepEqual(loaded.value, answers);
    }
    assert.equal((await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY)) !== null, true);
  });

  it('clears stored answers', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);

    await pending.savePendingInitialLifestyle(answers);
    await pending.clearPendingInitialLifestyle();
    const loaded = await pending.getPendingInitialLifestyle();

    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.equal(loaded.value, null);
    }
    assert.equal(await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY), null);
  });

  it('rejects incomplete answers', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    const { energy: _removed, ...incomplete } = answers;

    const result = await pending.savePendingInitialLifestyle(incomplete);

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'VALIDATION');
    }
    assert.equal(await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY), null);
  });

  it('rejects invalid answers and does not persist them', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);

    const result = await pending.savePendingInitialLifestyle({
      ...answers,
      sleepQuality: 0,
      lessHealthyFoodFrequency: 'often',
      alcoholConsumption: '15',
    });

    assert.equal(result.ok, false);
    assert.equal(await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY), null);
  });

  it('persists only the seven approved fields and no forbidden fields', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);

    const saved = await pending.savePendingInitialLifestyle({
      ...answers,
      planAdherence: 4,
      userId: 'user-1',
      email: 'user@example.com',
      healthScore: 74,
      focus: 'reduce_waist',
      planId: 'plan-1',
      snapshotId: 'snap-1',
    });

    assert.equal(saved.ok, false);
    assert.equal(await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY), null);

    const valid = await pending.savePendingInitialLifestyle(answers);
    assert.equal(valid.ok, true);
    if (valid.ok) {
      assert.deepEqual(pendingInitialLifestylePersistedKeys(valid.value), INITIAL_LIFESTYLE_PENDING_ALLOWED_KEYS);
      assert.equal('planAdherence' in valid.value, false);
      assert.equal('userId' in valid.value, false);
      assert.equal('email' in valid.value, false);
      assert.equal('healthScore' in valid.value, false);
    }

    const raw = await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY);
    assert.equal(raw?.includes('userId'), false);
    assert.equal(raw?.includes('email'), false);
    assert.equal(raw?.includes('healthScore'), false);
    assert.equal(raw?.includes('planAdherence'), false);
  });

  it('treats stale pending trainingFrequency payloads as absent', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);

    await storage.setItem(
      PENDING_INITIAL_LIFESTYLE_KEY,
      JSON.stringify({
        sleepQuality: 3,
        energy: 4,
        stress: 2,
        trainingFrequency: 'twice',
        everydayActivity: 3,
        eatingQuality: 4,
        alcoholConsumption: '1_3',
      }),
    );

    const loaded = await pending.getPendingInitialLifestyle();

    assert.equal(loaded.ok, true);
    if (loaded.ok) {
      assert.equal(loaded.value, null);
    }
  });

  it('binds answers to the signup user and rejects another account', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);

    assert.equal(await pending.bindPendingInitialLifestyleToUser('user-a'), 'bound');
    assert.equal(await pending.bindPendingInitialLifestyleToUser('user-a'), 'already_bound');
    assert.equal(await pending.bindPendingInitialLifestyleToUser('user-b'), 'absent');

    const forA = await pending.getPendingInitialLifestyleForUser('user-a');
    const forB = await pending.getPendingInitialLifestyleForUser('user-b');
    const unowned = await pending.getPendingInitialLifestyle();

    assert.equal(forA.ok, true);
    if (forA.ok) {
      assert.deepEqual(forA.value, answers);
    }
    assert.deepEqual(forB, { ok: true, value: null });
    assert.deepEqual(unowned, { ok: true, value: null });
  });

  it('does not let another account clear the bound retry data', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-a');

    await pending.clearPendingInitialLifestyleForUser('user-b');
    const stillForA = await pending.getPendingInitialLifestyleForUser('user-a');
    assert.equal(stillForA.ok, true);
    if (stillForA.ok) {
      assert.deepEqual(stillForA.value, answers);
    }

    await pending.clearPendingInitialLifestyleForUser('user-a');
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: null },
    );
  });

  it('keeps a bound retry while writing and binding a new anonymous draft', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('user-a');

    const anonymous = { ...answers, energy: 2 as const };
    assert.equal((await pending.savePendingInitialLifestyle(anonymous)).ok, true);
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: answers },
    );
    assert.deepEqual(await pending.getPendingInitialLifestyle(), {
      ok: true,
      value: anonymous,
    });

    assert.equal(await pending.getBindState('user-b'), 'bindable');
    assert.equal(await pending.bindPendingInitialLifestyleToUser('user-b'), 'bound');
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('user-b'),
      { ok: true, value: anonymous },
    );
  });

  it('migrates a legacy bound envelope without blocking a new anonymous save', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await storage.setItem(
      PENDING_INITIAL_LIFESTYLE_KEY,
      JSON.stringify({ version: 1, owner: 'user-a', value: answers }),
    );

    const anonymous = { ...answers, stress: 4 as const };
    assert.equal((await pending.savePendingInitialLifestyle(anonymous)).ok, true);
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('user-a'),
      { ok: true, value: answers },
    );
    assert.deepEqual(await pending.getPendingInitialLifestyle(), {
      ok: true,
      value: anonymous,
    });
    assert.match((await storage.getItem(PENDING_INITIAL_LIFESTYLE_KEY)) ?? '', /"version":2/);
  });

  it('releases a bound retry back to anonymous without deleting answers', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('typo-owner');

    await pending.releaseBinding('typo-owner');

    assert.deepEqual(await pending.getPendingInitialLifestyle(), {
      ok: true,
      value: answers,
    });
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('typo-owner'),
      { ok: true, value: null },
    );
  });

  it('refuses to release a bound retry over an occupied anonymous slot', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore(storage);
    await pending.savePendingInitialLifestyle(answers);
    await pending.bindPendingInitialLifestyleToUser('typo-owner');

    const anonymous = { ...answers, energy: 2 as const };
    await pending.savePendingInitialLifestyle(anonymous);

    await assert.rejects(
      pending.releaseBinding('typo-owner'),
      /cannot release a bound lifestyle over an anonymous draft/,
    );
    assert.deepEqual(await pending.getPendingInitialLifestyle(), {
      ok: true,
      value: anonymous,
    });
    assert.deepEqual(
      await pending.getPendingInitialLifestyleForUser('typo-owner'),
      { ok: true, value: answers },
    );
  });

  it('fails closed when an anonymous save cannot be persisted', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingInitialLifestyleStore({
      ...storage,
      async setItem() {
        throw new Error('storage unavailable');
      },
    });

    const result = await pending.savePendingInitialLifestyle(answers);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.code, 'UNKNOWN');
    }
  });
});
