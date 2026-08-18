import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AUTH_RESEND_COOLDOWN_MS,
  AUTH_VERIFICATION_COPY,
  buildCheckEmailBody,
  canResendVerification,
  maskEmailAddress,
  parseAuthCallbackParams,
  parseAuthCallbackUrl,
} from './auth-verification.presentation';
import { completeAuthEmailCallback } from './complete-auth-email-callback';
import { AUTH_EMAIL_REDIRECT_TO } from '../../services/auth/auth-redirect';
import { authMessages } from '../../services/auth/auth-errors';

describe('check-email presentation', () => {
  it('masks the local part and keeps the domain', () => {
    assert.equal(maskEmailAddress('jan@nordyan.se'), 'j***@nordyan.se');
    assert.equal(maskEmailAddress('  a@b.se  '), 'a***@b.se');
  });

  it('builds the approved body copy around the masked email', () => {
    assert.equal(
      buildCheckEmailBody('j***@nordyan.se'),
      'Vi har skickat en länk till j***@nordyan.se.',
    );
    assert.equal(AUTH_VERIFICATION_COPY.checkEmailHeading, 'Kolla din e-post');
    assert.equal(
      AUTH_VERIFICATION_COPY.checkEmailInstruction,
      'Öppna mailet och tryck på länken för att bekräfta kontot.',
    );
    assert.equal(AUTH_VERIFICATION_COPY.resend, 'Skicka mailet igen');
    assert.equal(AUTH_VERIFICATION_COPY.resendSubmitting, 'Skickar…');
    assert.equal(AUTH_VERIFICATION_COPY.resendSuccess, 'Ett nytt mail är på väg.');
    assert.equal(AUTH_VERIFICATION_COPY.returnToSignIn, 'Tillbaka till logga in');
    assert.equal(AUTH_VERIFICATION_COPY.callbackLoading, 'Bekräftar kontot…');
  });

  it('enforces a 60-second resend cooldown', () => {
    assert.equal(AUTH_RESEND_COOLDOWN_MS, 60_000);
    assert.equal(canResendVerification(null, 1_000), true);
    assert.equal(canResendVerification(1_000, 1_000 + 59_999), false);
    assert.equal(canResendVerification(1_000, 1_000 + 60_000), true);
  });
});

describe('callback URL parsing', () => {
  it('reads a PKCE code from the nordyan callback URL', () => {
    assert.deepEqual(parseAuthCallbackUrl(`${AUTH_EMAIL_REDIRECT_TO}?code=abc123`), {
      kind: 'code',
      code: 'abc123',
    });
  });

  it('rejects missing or error callback params', () => {
    assert.deepEqual(parseAuthCallbackParams({}), { kind: 'invalid' });
    assert.deepEqual(parseAuthCallbackParams({ error: 'access_denied' }), { kind: 'invalid' });
    assert.deepEqual(parseAuthCallbackUrl('not a url'), { kind: 'invalid' });
  });
});

describe('completeAuthEmailCallback', () => {
  const session = {
    user: { id: 'user-1', email: 'user@nordyan.se' },
    accessToken: 'token',
    expiresAt: null,
  };

  it('exchanges a PKCE code, persists pending data once, and is ready for the root gate', async () => {
    const exchanges: string[] = [];
    const syncs: number[] = [];
    const lifestyles: string[] = [];
    const clearedUserIds: string[] = [];

    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async (code) => {
        exchanges.push(code);
        return { ok: true, value: session };
      },
      syncPendingProfile: async () => {
        syncs.push(1);
        return {
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
        };
      },
      persistPendingLifestyle: async (userId) => {
        lifestyles.push(userId);
        return { ok: true, value: { persisted: true } };
      },
      clearCompletedOnboardingLocalData: async (userId) => {
        clearedUserIds.push(userId);
      },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(exchanges, ['pkce-code']);
    assert.deepEqual(syncs, [1]);
    assert.deepEqual(lifestyles, ['user-1']);
    assert.deepEqual(clearedUserIds, ['user-1']);
  });

  it('reuses an existing session on duplicate callback without exchanging again', async () => {
    let exchanges = 0;
    let syncs = 0;
    const clearedUserIds: string[] = [];

    const result = await completeAuthEmailCallback({
      params: { code: 'used-code' },
      getSession: async () => ({ ok: true, value: session }),
      exchangeCode: async () => {
        exchanges += 1;
        return { ok: false, error: { code: 'UNAUTHORIZED', message: authMessages.callbackExpired } };
      },
      syncPendingProfile: async () => {
        syncs += 1;
        return {
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
          persistedPending: false,
          snapshotCreated: false,
        };
      },
      persistPendingLifestyle: async () => ({ ok: true, value: { persisted: false } }),
      clearCompletedOnboardingLocalData: async (userId) => {
        clearedUserIds.push(userId);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(exchanges, 0);
    assert.equal(syncs, 1);
    assert.deepEqual(clearedUserIds, ['user-1']);
  });

  it('maps an expired or failed PKCE exchange without establishing a session', async () => {
    const result = await completeAuthEmailCallback({
      params: { code: 'expired-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => ({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: authMessages.callbackExpired },
      }),
      syncPendingProfile: async () => {
        throw new Error('must not sync');
      },
      persistPendingLifestyle: async () => {
        throw new Error('must not persist');
      },
      clearCompletedOnboardingLocalData: async () => {
        throw new Error('must not clear completed onboarding data');
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, authMessages.callbackExpired);
    }
  });

  it('maps a malformed callback to the expired/invalid copy', async () => {
    const result = await completeAuthEmailCallback({
      params: {},
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => {
        throw new Error('must not exchange');
      },
      syncPendingProfile: async () => {
        throw new Error('must not sync');
      },
      persistPendingLifestyle: async () => {
        throw new Error('must not persist');
      },
      clearCompletedOnboardingLocalData: async () => {
        throw new Error('must not clear completed onboarding data');
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, authMessages.callbackExpired);
    }
  });

  it('does not report success when required profile persistence fails', async () => {
    let lifestyleCalls = 0;
    let waitCleared = 0;

    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: null }),
      exchangeCode: async () => ({ ok: true, value: session }),
      syncPendingProfile: async () => ({
        ok: false,
        reason: 'sync_failed',
        error: { code: 'NETWORK', message: 'Det gick inte att spara din profil. Försök igen.' },
      }),
      persistPendingLifestyle: async () => {
        lifestyleCalls += 1;
        return { ok: true, value: { persisted: true } };
      },
      clearCompletedOnboardingLocalData: async () => {
        waitCleared += 1;
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, 'Det gick inte att spara din profil. Försök igen.');
    }
    assert.equal(lifestyleCalls, 0);
    assert.equal(waitCleared, 0);
  });

  it('does not report success when Initial Lifestyle persistence fails after profile save', async () => {
    let waitCleared = 0;

    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: session }),
      exchangeCode: async () => {
        throw new Error('must not exchange');
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
        error: { code: 'NETWORK', message: 'Kunde inte spara din livsstilskoll. Försök igen.' },
      }),
      clearCompletedOnboardingLocalData: async () => {
        waitCleared += 1;
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.error.message, 'Kunde inte spara din livsstilskoll. Försök igen.');
    }
    assert.equal(waitCleared, 0);
  });

  it('clears completed local onboarding data only after successful persistence', async () => {
    let waitCleared = 0;
    const clearedUserIds: string[] = [];

    const result = await completeAuthEmailCallback({
      params: { code: 'pkce-code' },
      getSession: async () => ({ ok: true, value: session }),
      exchangeCode: async () => {
        throw new Error('must not exchange');
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
        persistedPending: false,
        snapshotCreated: false,
      }),
      persistPendingLifestyle: async () => ({ ok: true, value: { persisted: false } }),
      clearCompletedOnboardingLocalData: async (userId) => {
        waitCleared += 1;
        clearedUserIds.push(userId);
      },
    });

    assert.equal(result.ok, true);
    assert.equal(waitCleared, 1);
    assert.deepEqual(clearedUserIds, ['user-1']);
  });
});
