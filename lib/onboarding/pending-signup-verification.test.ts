import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  createPendingSignupVerificationStore,
  PENDING_SIGNUP_VERIFICATION_KEY,
} from './pending-signup-verification';

describe('pending signup verification wait', () => {
  it('persists only email and owner UUID for restart restore', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingSignupVerificationStore(storage);

    await pending.save({ email: 'jan@nordyan.se', ownerId: 'user-a' });
    assert.deepEqual(await pending.get(), {
      email: 'jan@nordyan.se',
      ownerId: 'user-a',
    });

    const raw = await storage.getItem(PENDING_SIGNUP_VERIFICATION_KEY);
    assert.equal(typeof raw, 'string');
    const parsed = JSON.parse(raw ?? '{}') as Record<string, unknown>;
    assert.deepEqual(Object.keys(parsed).sort(), ['email', 'ownerId', 'version']);
    assert.equal('password' in parsed, false);
    assert.equal('accessToken' in parsed, false);
    assert.equal('refreshToken' in parsed, false);
    assert.equal('waistCm' in parsed, false);
    assert.equal('healthScore' in parsed, false);
  });

  it('survives a simulated app restart and can be cleared after verification', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const firstLaunch = createPendingSignupVerificationStore(storage);
    await firstLaunch.save({ email: 'jan@nordyan.se', ownerId: 'user-a' });

    const restarted = createPendingSignupVerificationStore(storage);
    assert.deepEqual(await restarted.get(), {
      email: 'jan@nordyan.se',
      ownerId: 'user-a',
    });

    await restarted.clear();
    assert.equal(await restarted.get(), null);
    assert.equal(await storage.getItem(PENDING_SIGNUP_VERIFICATION_KEY), null);
  });

  it('does not persist an empty or password-shaped payload', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pending = createPendingSignupVerificationStore(storage);

    await pending.save({ email: '', ownerId: 'user-a' });
    assert.equal(await pending.get(), null);

    await pending.save({ email: 'jan@nordyan.se', ownerId: '' });
    assert.equal(await pending.get(), null);
  });
});
