import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { AuthSession } from '@/lib/domain/auth';
import { resolveAppGate } from '@/lib/onboarding/resolve-app-gate';

import {
  classifyAuthServerUserFailure,
  resolveHydratedAuthSession,
} from './resolve-hydrated-auth-session';
import { createAuthService } from './auth.service.factory';
import type { AuthRepository } from '@/lib/repositories/auth.repository';

const session: AuthSession = {
  user: { id: 'user-1', email: null },
  accessToken: 'local-token',
  expiresAt: null,
};

function repository(overrides: Partial<AuthRepository> = {}): AuthRepository {
  return {
    getSession: async () => ({ ok: true, value: session }),
    getStatus: async () => ({ ok: true, value: 'authenticated' }),
    getCurrentUser: async () => ({ ok: true, value: session.user }),
    getServerUser: async () => ({ ok: true, value: session.user }),
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

describe('classifyAuthServerUserFailure', () => {
  it('treats missing/invalid/deleted auth users as stale', () => {
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'UNAUTHORIZED',
        message: 'generic',
        cause: { status: 401, message: 'User from sub claim in JWT does not exist' },
      }),
      'stale_invalid',
    );
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'UNKNOWN',
        message: 'generic',
        cause: { status: 403, code: 'session_not_found' },
      }),
      'stale_invalid',
    );
  });

  it('does not treat network or timeout failures as a deleted user', () => {
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'NETWORK',
        message: 'unavailable',
      }),
      'transient_error',
    );
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'UNKNOWN',
        message: 'generic',
        cause: { message: 'Failed to fetch', status: 0 },
      }),
      'transient_error',
    );
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'UNKNOWN',
        message: 'generic',
        cause: { status: 503, message: 'timeout' },
      }),
      'transient_error',
    );
    assert.equal(
      classifyAuthServerUserFailure({
        code: 'UNAUTHORIZED',
        message: 'generic',
        cause: { status: 400, message: 'Email not confirmed' },
      }),
      'transient_error',
    );
  });
});

describe('resolveHydratedAuthSession', () => {
  it('is unauthenticated when no local session is stored', () => {
    assert.deepEqual(
      resolveHydratedAuthSession({
        localSession: { ok: true, value: null },
        serverUser: null,
      }),
      {
        session: null,
        status: 'unauthenticated',
        shouldClearLocalSession: false,
        errorClass: 'none',
      },
    );
  });

  it('keeps a stored session when getUser confirms the same user', () => {
    const hydrated = resolveHydratedAuthSession({
      localSession: { ok: true, value: session },
      serverUser: { ok: true, value: { id: 'user-1' } },
    });
    assert.equal(hydrated.status, 'authenticated');
    assert.equal(hydrated.session?.user.id, 'user-1');
    assert.equal(hydrated.shouldClearLocalSession, false);
  });

  it('clears a stored session when getUser returns a different or missing user', () => {
    const mismatched = resolveHydratedAuthSession({
      localSession: { ok: true, value: session },
      serverUser: { ok: true, value: { id: 'other-user' } },
    });
    assert.equal(mismatched.shouldClearLocalSession, true);
    assert.equal(mismatched.status, 'unauthenticated');

    const missing = resolveHydratedAuthSession({
      localSession: { ok: true, value: session },
      serverUser: { ok: true, value: null },
    });
    assert.equal(missing.shouldClearLocalSession, true);
    assert.equal(missing.status, 'unauthenticated');
  });

  it('clears a stored session when the Auth user is missing or invalid', () => {
    const hydrated = resolveHydratedAuthSession({
      localSession: { ok: true, value: session },
      serverUser: {
        ok: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'generic',
          cause: { status: 401, message: 'User from sub claim in JWT does not exist' },
        },
      },
    });
    assert.equal(hydrated.status, 'unauthenticated');
    assert.equal(hydrated.shouldClearLocalSession, true);
    assert.equal(hydrated.session, null);
  });

  it('keeps the stored session on a temporary network failure', () => {
    const hydrated = resolveHydratedAuthSession({
      localSession: { ok: true, value: session },
      serverUser: {
        ok: false,
        error: { code: 'NETWORK', message: 'unavailable' },
      },
    });
    assert.equal(hydrated.status, 'authenticated');
    assert.equal(hydrated.shouldClearLocalSession, false);
    assert.equal(hydrated.session?.user.id, 'user-1');
  });
});

describe('hydrateLocalSession', () => {
  it('does not call getUser when there is no local session', async () => {
    let serverCalls = 0;
    const service = createAuthService(
      repository({
        getSession: async () => ({ ok: true, value: null }),
        getServerUser: async () => {
          serverCalls += 1;
          return { ok: true, value: null };
        },
      }),
    );
    const hydrated = await service.hydrateLocalSession();
    assert.equal(serverCalls, 0);
    assert.equal(hydrated.status, 'unauthenticated');
  });

  it('clears a stale session so the app gate never sees it as authenticated', async () => {
    const service = createAuthService(
      repository({
        getServerUser: async () => ({
          ok: false,
          error: {
            code: 'UNKNOWN',
            message: 'generic',
            cause: { status: 401, message: 'user not found' },
          },
        }),
      }),
    );
    const hydrated = await service.hydrateLocalSession();
    assert.equal(hydrated.shouldClearLocalSession, true);
    assert.equal(hydrated.status, 'unauthenticated');

    const gate = await resolveAppGate({
      isReady: true,
      isAuthenticated: hydrated.status === 'authenticated',
      userId: hydrated.session?.user.id ?? null,
      getPendingSignupVerification: async () => null,
      persistPendingConsent: async () => ({ ok: true, value: { persisted: false } }),
      hasActiveCurrentConsent: async () => false,
    });
    assert.equal(gate.destination, 'onboarding');
    assert.notEqual(gate.destination, 'authenticated-health-data-consent');
    assert.notEqual(gate.destination, 'home');
    assert.notEqual(gate.destination, 'onboarding-step-4');
  });

  it('keeps a valid session authenticated after getUser', async () => {
    const service = createAuthService(repository());
    const hydrated = await service.hydrateLocalSession();
    assert.equal(hydrated.status, 'authenticated');
    assert.equal(hydrated.shouldClearLocalSession, false);
  });

  it('does not treat a temporary network failure as a deleted user', async () => {
    const service = createAuthService(
      repository({
        getServerUser: async () => ({
          ok: false,
          error: { code: 'NETWORK', message: 'unavailable' },
        }),
      }),
    );
    const hydrated = await service.hydrateLocalSession();
    assert.equal(hydrated.status, 'authenticated');
    assert.equal(hydrated.shouldClearLocalSession, false);
    assert.equal(hydrated.errorClass, 'transient_error');
  });
});
