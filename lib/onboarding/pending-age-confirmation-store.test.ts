import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  PENDING_AGE_CONFIRMATION_KEY,
  createPendingAgeConfirmationStore,
} from './pending-age-confirmation-store';

describe('pending age confirmation store', () => {
  it('starts unconfirmed and persists only an explicit YES', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const store = createPendingAgeConfirmationStore(storage);

    assert.equal(await store.hasConfirmed18Plus(), false);
    await store.saveConfirmed18Plus();
    assert.equal(await store.hasConfirmed18Plus(), true);

    const raw = await storage.getItem(PENDING_AGE_CONFIRMATION_KEY);
    assert.equal(raw?.includes('"confirmed18Plus":true'), true);
    assert.equal(raw?.includes('false'), false);
  });

  it('does not treat a stored NO or invalid payload as confirmation', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const store = createPendingAgeConfirmationStore(storage);

    await storage.setItem(
      PENDING_AGE_CONFIRMATION_KEY,
      JSON.stringify({ version: 1, confirmed18Plus: false }),
    );
    assert.equal(await store.hasConfirmed18Plus(), false);

    await storage.setItem(PENDING_AGE_CONFIRMATION_KEY, 'not-json');
    assert.equal(await store.hasConfirmed18Plus(), false);
  });

  it('clears the unowned YES flag', async () => {
    const store = createPendingAgeConfirmationStore(createMemoryPendingKeyValueStore());
    await store.saveConfirmed18Plus();
    await store.clear();
    assert.equal(await store.hasConfirmed18Plus(), false);
  });
});
