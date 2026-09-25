import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { recordCoachQuickQuestionTrioShown } from '../../domain/coach-quick-questions';

import {
  coachQuickQuestionRotationKey,
  createCoachQuickQuestionRotationStore,
  createMemoryCoachQuickQuestionRotationKeyValueStore,
} from './coach-quick-question-rotation.store';

describe('coach quick-question rotation store', () => {
  it('persists and reads a shown trio per user', async () => {
    const storage = createMemoryCoachQuickQuestionRotationKeyValueStore();
    const store = createCoachQuickQuestionRotationStore(storage);
    const shownAt = new Date('2026-09-18T10:00:00.000Z');
    const state = recordCoachQuickQuestionTrioShown(
      null,
      ['health_score_main_driver', 'sleep_improve', 'health_overall'],
      shownAt,
    );

    await store.write('user-a', state);
    const read = await store.read('user-a');
    assert.deepEqual([...read.activeIds], [...state.activeIds]);
    assert.equal(read.activeShownAt, shownAt.toISOString());
    assert.equal(read.lastShownAtById.sleep_improve, shownAt.toISOString());
    assert.deepEqual((await store.read('user-b')).activeIds, []);
    assert.equal(coachQuickQuestionRotationKey('user-a').includes('user-a'), true);
  });

  it('fails closed to empty rotation on invalid JSON', async () => {
    const storage = createMemoryCoachQuickQuestionRotationKeyValueStore();
    await storage.setItem(coachQuickQuestionRotationKey('user-a'), '{not-json');
    const store = createCoachQuickQuestionRotationStore(storage);
    const read = await store.read('user-a');
    assert.deepEqual([...read.activeIds], []);
    assert.equal(read.activeShownAt, null);
  });
});
