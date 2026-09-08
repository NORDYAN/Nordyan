import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE,
  coachHomeBodyFatDiscoveryKey,
  createCoachHomeBodyFatDiscoveryStore,
  createMemoryCoachHomeBodyFatDiscoveryKeyValueStore,
  type CoachHomeBodyFatDiscoveryKeyValueStore,
} from './coach-home-body-fat-discovery.store';

describe('coach home body-fat discovery persistence', () => {
  it('stores a local used flag per user without question text', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const store = createCoachHomeBodyFatDiscoveryStore(storage);

    assert.equal(await store.getUsed('user-a'), false);
    await store.markUsed('user-a');
    assert.equal(await store.getUsed('user-a'), true);
    const raw = await storage.getItem(coachHomeBodyFatDiscoveryKey('user-a'));
    assert.equal(raw, COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE);
    assert.equal(raw?.includes('fettprocent'), false);
  });

  it('keeps the flag after reload and isolated per user', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const firstSession = createCoachHomeBodyFatDiscoveryStore(storage);
    await firstSession.markUsed('user-a');

    const reloadedSession = createCoachHomeBodyFatDiscoveryStore(storage);
    assert.equal(await reloadedSession.getUsed('user-a'), true);
    assert.equal(await reloadedSession.getUsed('user-b'), false);
    assert.notEqual(
      coachHomeBodyFatDiscoveryKey('user-a'),
      coachHomeBodyFatDiscoveryKey('user-b'),
    );
  });

  it('fails safely when storage read fails', async () => {
    const failingStorage: CoachHomeBodyFatDiscoveryKeyValueStore = {
      async getItem(): Promise<string | null> {
        throw new Error('storage unavailable');
      },
      async setItem(): Promise<void> {
        throw new Error('storage unavailable');
      },
    };
    const store = createCoachHomeBodyFatDiscoveryStore(failingStorage);

    assert.equal(await store.getUsed('user-a'), false);
    await store.markUsed('user-a');
    assert.equal(await store.getUsed('user-a'), false);
  });
});
