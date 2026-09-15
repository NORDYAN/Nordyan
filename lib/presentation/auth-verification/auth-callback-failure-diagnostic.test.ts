import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { completeAuthEmailCallback } from './complete-auth-email-callback';
import {
  buildAuthCallbackFailureDiagnostic,
  toAuthCallbackFailureTraceDetails,
} from './auth-callback-failure-diagnostic';
import { authMessages } from '@/lib/services/auth/auth-errors';

const session = {
  user: { id: 'user-1', email: 'user@nordyan.se' },
  accessToken: 'token',
  expiresAt: null,
};

describe('auth callback failure diagnostics', () => {
  it('distinguishes PKCE exchange failure from persistence failure', async () => {
    const exchangeFailure = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => ({
        ok: false,
        error: {
          code: 'UNKNOWN',
          message: authMessages.callbackGeneric,
          cause: {
            code: 'flow_state_not_found',
            status: 400,
            message: 'Invalid flow state, no valid flow state found',
          },
        },
      }),
      syncPendingProfile: async () => {
        throw new Error('must not persist profile after exchange failure');
      },
      persistPendingLifestyle: async () => {
        throw new Error('must not persist lifestyle after exchange failure');
      },
      clearCompletedOnboardingLocalData: async () => {
        throw new Error('must not clear onboarding after exchange failure');
      },
    });

    assert.equal(exchangeFailure.ok, false);
    if (!exchangeFailure.ok) {
      assert.equal(exchangeFailure.error.message, authMessages.callbackGeneric);
      assert.deepEqual(exchangeFailure.diagnostic, {
        failureStage: 'exchange',
        exchangeAttempted: true,
        exchangeSucceeded: false,
        persistStage: 'none',
        persistReason: null,
        errorCode: 'UNKNOWN',
        causeCode: 'flow_state_not_found',
        causeStatus: 400,
        causeMessage: 'Invalid flow state, no valid flow state found',
      });
    }

    const persistFailure = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => ({ ok: true, value: session }),
      syncPendingProfile: async () => ({
        ok: false,
        reason: 'sync_failed',
        error: {
          code: 'NETWORK',
          message: 'Det gick inte att spara din profil. Försök igen.',
          cause: { code: 'PGRST301', status: 401, message: 'permission denied for table profiles' },
        },
      }),
      persistPendingLifestyle: async () => {
        throw new Error('must not persist lifestyle after profile failure');
      },
      clearCompletedOnboardingLocalData: async () => {
        throw new Error('must not clear onboarding after profile failure');
      },
    });

    assert.equal(persistFailure.ok, false);
    if (!persistFailure.ok) {
      assert.equal(persistFailure.error.message, 'Det gick inte att spara din profil. Försök igen.');
      assert.equal(persistFailure.diagnostic.failureStage, 'profile_persist');
      assert.equal(persistFailure.diagnostic.exchangeAttempted, true);
      assert.equal(persistFailure.diagnostic.exchangeSucceeded, true);
      assert.equal(persistFailure.diagnostic.persistStage, 'profile');
      assert.equal(persistFailure.diagnostic.persistReason, 'sync_failed');
      assert.equal(persistFailure.diagnostic.errorCode, 'NETWORK');
      assert.equal(persistFailure.diagnostic.causeCode, 'PGRST301');
      assert.equal(persistFailure.diagnostic.causeStatus, 401);
      assert.equal(
        persistFailure.diagnostic.causeMessage,
        'permission denied for table profiles',
      );
    }
  });

  it('classifies lifestyle persistence separately after a successful exchange', async () => {
    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: session }),
      exchangeCode: async () => {
        throw new Error('must not exchange when a session already exists');
      },
      syncPendingProfile: async () => ({
        ok: true,
        profile: {
          id: 'profile-1',
          userId: 'user-1',
          firstName: null,
          dateOfBirth: '1980-01-01',
          gender: 'male',
          heightCm: 180,
          weightKg: 80,
          waistCm: null,
          neckCm: null,
          activityLevel: 'moderately_active',
          goal: null,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
        },
        persistedPending: true,
        snapshotCreated: true,
      }),
      persistPendingLifestyle: async () => ({
        ok: false,
        error: {
          code: 'UNKNOWN',
          message: 'Kunde inte spara din livsstilskoll. Försök igen.',
          cause: { message: 'insert failed', status: 500 },
        },
      }),
      clearCompletedOnboardingLocalData: async () => {
        throw new Error('must not clear onboarding after lifestyle failure');
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.diagnostic.failureStage, 'lifestyle_persist');
      assert.equal(result.diagnostic.exchangeAttempted, false);
      assert.equal(result.diagnostic.exchangeSucceeded, false);
      assert.equal(result.diagnostic.persistStage, 'lifestyle');
      assert.equal(result.diagnostic.causeStatus, 500);
      assert.equal(result.diagnostic.causeMessage, 'insert failed');
    }
  });

  it('does not put auth codes, tokens, or verifiers in diagnostic payloads', () => {
    const diagnostic = buildAuthCallbackFailureDiagnostic({
      failureStage: 'exchange',
      exchangeAttempted: true,
      exchangeSucceeded: false,
      persistStage: 'none',
      error: {
        code: 'UNKNOWN',
        message: authMessages.callbackGeneric,
        cause: {
          code: 'invalid_grant',
          message:
            'access_token=secret refresh_token=secret code_verifier=secret Bearer eyJhbGciOiJIUzI1NiJ9.payload',
        },
      },
    });
    const details = toAuthCallbackFailureTraceDetails(diagnostic, false);
    const serialized = JSON.stringify(details);

    assert.equal(details.causeMessage, '[redacted]');
    assert.doesNotMatch(serialized, /access_token=secret/);
    assert.doesNotMatch(serialized, /refresh_token=secret/);
    assert.doesNotMatch(serialized, /code_verifier=secret/);
    assert.doesNotMatch(serialized, /eyJhbGciOiJIUzI1NiJ9/);
    assert.equal('code' in details, false);
    assert.equal('params' in details, false);
  });
});

describe('auth callback failure diagnostic source contracts', () => {
  it('logs allowlisted failure fields without embedding secrets in the callback screen', () => {
    const callback = fs.readFileSync(path.join(process.cwd(), 'app/auth/callback.tsx'), 'utf8');
    const diagnostic = fs.readFileSync(
      path.join(
        process.cwd(),
        'lib/presentation/auth-verification/auth-callback-failure-diagnostic.ts',
      ),
      'utf8',
    );

    assert.match(callback, /toAuthCallbackFailureTraceDetails\(result\.diagnostic, sessionAfter\)/);
    assert.match(callback, /sessionAfter/);
    assert.doesNotMatch(
      callback.slice(callback.indexOf('if (!result.ok)'), callback.indexOf("result: 'success'")),
      /params\.code|access_token|refresh_token|code_verifier/,
    );
    assert.doesNotMatch(callback, /access_token|refresh_token|code_verifier/);
    assert.doesNotMatch(diagnostic, /accessToken|refreshToken|emailRedirectTo/);
    assert.match(diagnostic, /SECRET_MESSAGE_PATTERN/);
  });
});
