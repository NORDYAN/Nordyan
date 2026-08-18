import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import type { InitialLifestyleAnswers } from '@/lib/domain/initial-lifestyle';
import type { ProfileMeasurements } from '@/lib/domain/profile';
import { setActiveLocale, t } from '@/lib/i18n';
import { createPendingInitialLifestyleStore } from '@/lib/onboarding/pending-initial-lifestyle-store';
import { createMemoryPendingKeyValueStore } from '@/lib/onboarding/pending-key-value-store';
import { createPendingProfileStore } from '@/lib/onboarding/pending-profile-store';
import { authMessages } from '@/lib/services/auth/auth-errors';

import {
  PASSWORD_RECOVERY_COOLDOWN_MS,
  canRequestPasswordRecoveryAgain,
  completePasswordRecoveryCallback,
  parsePasswordRecoveryCallbackParams,
} from './password-recovery.presentation';

const session = {
  user: { id: 'existing-user', email: 'existing@example.com' },
  accessToken: 'test-access-token',
  expiresAt: null,
};

afterEach(() => setActiveLocale('sv'));

describe('password recovery callback', () => {
  it('identifies and exchanges a valid recovery PKCE callback', async () => {
    const exchanges: string[] = [];
    const result = await completePasswordRecoveryCallback({
      params: { code: 'recovery-code' },
      exchangeCode: async (code) => {
        exchanges.push(code);
        return { ok: true, value: session };
      },
    });

    assert.equal(result.ok, true);
    assert.deepEqual(exchanges, ['recovery-code']);
  });

  it('maps expired, malformed, and reused links to a safe recovery state', async () => {
    assert.deepEqual(parsePasswordRecoveryCallbackParams({}), { kind: 'invalid' });
    assert.deepEqual(
      parsePasswordRecoveryCallbackParams({ error_code: 'otp_expired' }),
      { kind: 'invalid' },
    );

    const reused = await completePasswordRecoveryCallback({
      params: { code: 'used-code' },
      exchangeCode: async () => ({
        ok: false,
        error: { code: 'UNAUTHORIZED', message: 'provider detail' },
      }),
    });
    assert.equal(reused.ok, false);
    if (!reused.ok) {
      assert.equal(reused.error.message, authMessages.recoveryInvalid);
      assert.equal(reused.error.message.includes('provider detail'), false);
    }

    const networkFailure = await completePasswordRecoveryCallback({
      params: { code: 'network-code' },
      exchangeCode: async () => {
        throw new Error('offline');
      },
    });
    assert.equal(networkFailure.ok, false);
    if (!networkFailure.ok) {
      assert.equal(networkFailure.error.message, authMessages.recoveryInvalid);
    }
  });

  it('does not bind, persist, clear, or expose an anonymous onboarding bundle', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const pendingProfile = createPendingProfileStore(storage);
    const pendingLifestyle = createPendingInitialLifestyleStore(storage);
    const profile: ProfileMeasurements = {
      dateOfBirth: '1988-03-12',
      gender: 'male',
      heightCm: 180,
      weightKg: 80,
      activityLevel: 'moderately_active',
    };
    const lifestyle: InitialLifestyleAnswers = {
      sleepQuality: 3,
      energy: 4,
      stress: 2,
      lessHealthyFoodFrequency: 'two_three',
      everydayActivity: 3,
      eatingQuality: 4,
      alcoholConsumption: '1_3',
    };
    await pendingProfile.saveUnowned(profile);
    await pendingLifestyle.savePendingInitialLifestyle(lifestyle);

    assert.equal(
      (
        await completePasswordRecoveryCallback({
          params: { code: 'recovery-code' },
          exchangeCode: async () => ({ ok: true, value: session }),
        })
      ).ok,
      true,
    );

    assert.deepEqual(await pendingProfile.getUnowned(), profile);
    assert.equal(await pendingProfile.getForUser('existing-user'), null);
    assert.deepEqual(await pendingLifestyle.getPendingInitialLifestyle(), {
      ok: true,
      value: lifestyle,
    });
    assert.deepEqual(
      await pendingLifestyle.getPendingInitialLifestyleForUser('existing-user'),
      { ok: true, value: null },
    );
  });
});

describe('password recovery presentation', () => {
  it('enforces the resend cooldown', () => {
    assert.equal(PASSWORD_RECOVERY_COOLDOWN_MS, 60_000);
    assert.equal(canRequestPasswordRecoveryAgain(null, 1_000), true);
    assert.equal(canRequestPasswordRecoveryAgain(1_000, 60_999), false);
    assert.equal(canRequestPasswordRecoveryAgain(1_000, 61_000), true);
  });

  it('provides complete Swedish and Bokmål recovery copy', () => {
    setActiveLocale('sv');
    assert.equal(t('auth.recovery.forgotPassword'), 'Glömt lösenord?');
    assert.equal(t('auth.recovery.request.title'), 'Återställ lösenord');
    assert.equal(t('auth.recovery.reset.submit'), 'Spara nytt lösenord');
    assert.equal(
      t('auth.recovery.request.neutralSuccess'),
      'Om det finns ett konto med den e-postadressen har vi skickat en länk för att återställa lösenordet.',
    );

    setActiveLocale('nb');
    assert.equal(t('auth.recovery.forgotPassword'), 'Glemt passord?');
    assert.equal(t('auth.recovery.request.title'), 'Tilbakestill passord');
    assert.equal(t('auth.recovery.reset.submit'), 'Lagre nytt passord');
    assert.equal(t('auth.recovery.error.passwordMismatch'), 'Passordene er ikke like.');
    assert.equal(
      t('auth.recovery.request.neutralSuccess'),
      'Hvis det finnes en konto med denne e-postadressen, har vi sendt en lenke for å tilbakestille passordet.',
    );
  });
});
