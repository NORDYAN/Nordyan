import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { deleteCurrentAccount } from './delete-current-account';

describe('deleteCurrentAccount', () => {
  it('does not wipe local data or sign out when the server rejects deletion', async () => {
    let cleared = false;
    let signedOut = false;

    const result = await deleteCurrentAccount({
      session: { userId: 'user-1', accessToken: 'token' },
      authClient: {
        signOut: async () => {
          signedOut = true;
          return { ok: true };
        },
      },
      requestDelete: async () => ({ ok: false, reason: 'network' }),
      clearLocalData: async () => {
        cleared = true;
      },
    });

    assert.equal(result.ok, false);
    assert.equal(cleared, false);
    assert.equal(signedOut, false);
  });

  it('clears local data and signs out after server success even if cleanup throws', async () => {
    let signedOut = false;

    const result = await deleteCurrentAccount({
      session: { userId: 'user-1', accessToken: 'token' },
      authClient: {
        signOut: async () => {
          signedOut = true;
          return { ok: false, error: { code: 'UNKNOWN', message: 'gone' } };
        },
      },
      requestDelete: async () => ({ ok: true }),
      clearLocalData: async () => {
        throw new Error('disk full');
      },
    });

    assert.equal(result.ok, true);
    assert.equal(signedOut, true);
  });
});
