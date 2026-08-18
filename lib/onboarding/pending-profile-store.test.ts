import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { ProfileMeasurements } from '../domain/profile';
import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import { createPendingProfileStore, PENDING_PROFILE_KEY } from './pending-profile-store';

const measurements: ProfileMeasurements = {
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderately_active',
};

describe('pending profile ownership', () => {
  it('keeps pre-auth onboarding data unowned until successful signup binds it', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);

    await pending.saveUnowned(measurements);
    assert.deepEqual(await pending.getUnowned(), measurements);
    assert.equal(await pending.getForUser('user-a'), null);

    assert.equal(await pending.bindToUser('user-a'), 'bound');
    assert.equal(await pending.getUnowned(), null);
    assert.deepEqual(await pending.getForUser('user-a'), measurements);
  });

  it('never exposes, rebinds, updates, or clears User A data for User B', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);
    await pending.saveUnowned(measurements);
    await pending.bindToUser('user-a');

    assert.equal(await pending.bindToUser('user-b'), 'absent');
    assert.equal(await pending.getForUser('user-b'), null);
    assert.equal(await pending.updateUnowned({ weightKg: 99 }), null);

    await pending.clearForUser('user-b');
    assert.deepEqual(await pending.getForUser('user-a'), measurements);

    await pending.clearForUser('user-a');
    assert.equal(await pending.getForUser('user-a'), null);
  });

  it('stores a later anonymous draft alongside a bound retry bundle', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);
    await pending.saveUnowned(measurements);
    await pending.bindToUser('user-a');

    const anonymous = { ...measurements, heightCm: 150, weightKg: 50 };
    assert.equal(await pending.saveUnowned(anonymous), 'written');

    assert.deepEqual(await pending.getUnowned(), anonymous);
    assert.deepEqual(await pending.getForUser('user-a'), measurements);
  });

  it('binds the anonymous draft without disturbing another user retry', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);
    await pending.saveUnowned(measurements);
    await pending.bindToUser('user-a');

    const anonymous = { ...measurements, heightCm: 150, weightKg: 50 };
    await pending.saveUnowned(anonymous);

    assert.equal(await pending.getBindState('user-b'), 'bindable');
    assert.equal(await pending.bindToUser('user-b'), 'bound');
    assert.deepEqual(await pending.getForUser('user-a'), measurements);
    assert.deepEqual(await pending.getForUser('user-b'), anonymous);
    assert.equal(await pending.getUnowned(), null);
  });

  it('migrates a legacy bound envelope while preserving it beside a new anonymous draft', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);
    await storage.setItem(
      PENDING_PROFILE_KEY,
      JSON.stringify({ version: 1, owner: 'user-a', value: measurements }),
    );

    const anonymous = { ...measurements, heightCm: 150, weightKg: 50 };
    assert.equal(await pending.saveUnowned(anonymous), 'written');

    assert.deepEqual(await pending.getForUser('user-a'), measurements);
    assert.deepEqual(await pending.getUnowned(), anonymous);
    assert.match((await storage.getItem(PENDING_PROFILE_KEY)) ?? '', /"version":2/);
  });

  it('treats legacy raw pending measurements as unowned and bindable once', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore(storage);
    await storage.setItem(PENDING_PROFILE_KEY, JSON.stringify(measurements));

    assert.deepEqual(await pending.getUnowned(), measurements);
    assert.equal(await pending.bindToUser('user-a'), 'bound');
    assert.deepEqual(await pending.getForUser('user-a'), measurements);
  });

  it('does not report written when anonymous persistence fails', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingProfileStore({
      ...storage,
      async setItem() {
        throw new Error('storage unavailable');
      },
    });

    await assert.rejects(pending.saveUnowned(measurements), /storage unavailable/);
    assert.equal(await pending.getUnowned(), null);
  });
});
