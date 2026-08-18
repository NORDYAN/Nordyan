import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { selectCoachHomeQuickQuestionSlots } from './coach-home.presentation';
import { COACH_HOME_CONTEXTUAL_QUESTION_CATALOG } from './coach-home.types';
import {
  COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE,
  coachHomeBodyFatDiscoveryKey,
  createCoachHomeBodyFatDiscoveryStore,
  createMemoryCoachHomeBodyFatDiscoveryKeyValueStore,
  type CoachHomeBodyFatDiscoveryKeyValueStore,
} from './coach-home-body-fat-discovery.store';

function middleQuestion(userId: string, store: ReturnType<typeof createCoachHomeBodyFatDiscoveryStore>) {
  return store.getUsed(userId).then((bodyFatComparisonUsed) => {
    const slots = selectCoachHomeQuickQuestionSlots({ bodyFatComparisonUsed });
    return slots[1]?.question;
  });
}

describe('coach home body-fat discovery persistence', () => {
  it('shows the body-fat discovery question for a new user', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const store = createCoachHomeBodyFatDiscoveryStore(storage);

    assert.equal(await store.getUsed('user-a'), false);
    assert.equal(
      await middleQuestion('user-a', store),
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
    );
    assert.equal(await storage.getItem(coachHomeBodyFatDiscoveryKey('user-a')), null);
  });

  it('replaces the middle slot after the discovery question is submitted', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const store = createCoachHomeBodyFatDiscoveryStore(storage);

    await store.markUsed('user-a');

    assert.equal(await store.getUsed('user-a'), true);
    assert.equal(
      await middleQuestion('user-a', store),
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.planMoreEffective,
    );
    assert.equal(
      await storage.getItem(coachHomeBodyFatDiscoveryKey('user-a')),
      COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE,
    );
  });

  it('keeps the replacement after reload from the same persisted flag', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const firstSession = createCoachHomeBodyFatDiscoveryStore(storage);
    await firstSession.markUsed('user-a');

    const reloadedSession = createCoachHomeBodyFatDiscoveryStore(storage);

    assert.equal(await reloadedSession.getUsed('user-a'), true);
    assert.equal(
      await middleQuestion('user-a', reloadedSession),
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.planMoreEffective,
    );
  });

  it('keeps the discovery question available for another user', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const store = createCoachHomeBodyFatDiscoveryStore(storage);
    await store.markUsed('user-a');

    assert.equal(await store.getUsed('user-a'), true);
    assert.equal(await store.getUsed('user-b'), false);
    assert.equal(
      await middleQuestion('user-b', store),
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
    );
    assert.notEqual(
      coachHomeBodyFatDiscoveryKey('user-a'),
      coachHomeBodyFatDiscoveryKey('user-b'),
    );
  });

  it('fails safely to the body-fat discovery question when storage read fails', async () => {
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
    assert.equal(
      await middleQuestion('user-a', store),
      COACH_HOME_CONTEXTUAL_QUESTION_CATALOG.bodyFatComparison,
    );
    await store.markUsed('user-a');
    assert.equal(await store.getUsed('user-a'), false);
  });

  it('stores only the used flag and never question or answer text', async () => {
    const storage = createMemoryCoachHomeBodyFatDiscoveryKeyValueStore();
    const store = createCoachHomeBodyFatDiscoveryStore(storage);
    await store.markUsed('user-a');

    const raw = await storage.getItem(coachHomeBodyFatDiscoveryKey('user-a'));
    assert.equal(raw, COACH_HOME_BODY_FAT_DISCOVERY_USED_VALUE);
    assert.equal(raw?.includes('fettprocent'), false);
    assert.equal(raw?.includes('plan'), false);
  });
});
