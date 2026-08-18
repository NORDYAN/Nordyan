import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AuthRepository } from '@/lib/repositories/auth.repository';

import { authMessages } from './auth-errors';
import { createAuthService } from './auth.service.factory';

function createRepository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  const session = {
    user: { id: 'user-1', email: 'user@example.com' },
    accessToken: 'test-access-token',
    expiresAt: null,
  };
  return {
    getSession: async () => ({ ok: true, value: session }),
    getStatus: async () => ({ ok: true, value: 'authenticated' }),
    getCurrentUser: async () => ({ ok: true, value: session.user }),
    signInWithEmail: async () => ({ ok: true, value: session }),
    signUpWithEmail: async () => ({
      ok: true,
      value: { kind: 'authenticated', session },
    }),
    resendSignupVerification: async () => ({ ok: true, value: undefined }),
    requestPasswordRecovery: async () => ({ ok: true, value: undefined }),
    exchangeAuthCallbackCode: async () => ({ ok: true, value: session }),
    updatePassword: async () => ({ ok: true, value: undefined }),
    signOut: async () => ({ ok: true, value: undefined }),
    ...overrides,
  };
}

describe('password recovery auth service', () => {
  it('trims a valid email before requesting a neutral recovery email', async () => {
    const requests: string[] = [];
    const service = createAuthService(
      createRepository({
        requestPasswordRecovery: async (email) => {
          requests.push(email);
          return { ok: true, value: undefined };
        },
      }),
    );

    assert.equal((await service.requestPasswordRecovery('  USER@Example.COM ')).ok, true);
    assert.deepEqual(requests, ['USER@Example.COM']);
  });

  it('rejects an invalid email before calling the repository', async () => {
    let calls = 0;
    const service = createAuthService(
      createRepository({
        requestPasswordRecovery: async () => {
          calls += 1;
          return { ok: true, value: undefined };
        },
      }),
    );

    const result = await service.requestPasswordRecovery('not-an-email');
    assert.equal(result.ok, false);
    assert.equal(calls, 0);
  });

  it('rejects mismatched and short passwords with localized validation', async () => {
    let updates = 0;
    const service = createAuthService(
      createRepository({
        updatePassword: async () => {
          updates += 1;
          return { ok: true, value: undefined };
        },
      }),
    );

    const mismatch = await service.updatePassword('password12', 'password13');
    assert.equal(mismatch.ok, false);
    if (!mismatch.ok) {
      assert.equal(mismatch.error.message, authMessages.passwordMismatch);
    }
    assert.equal((await service.updatePassword('short', 'short')).ok, false);
    assert.equal(updates, 0);
  });

  it('updates a valid password through the repository', async () => {
    let updates = 0;
    const service = createAuthService(
      createRepository({
        updatePassword: async () => {
          updates += 1;
          return { ok: true, value: undefined };
        },
      }),
    );

    assert.equal((await service.updatePassword('password12', 'password12')).ok, true);
    assert.equal(updates, 1);
  });
});
