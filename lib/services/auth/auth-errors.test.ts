import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toSignUpOutcome } from './to-sign-up-outcome';
import {
  AUTH_CALLBACK_PATH,
  AUTH_EMAIL_REDIRECT_TO,
  EMAIL_VERIFICATION_NATIVE_CALLBACK,
  EMAIL_VERIFICATION_WEB_REDIRECT,
  PASSWORD_RECOVERY_CALLBACK_PATH,
  PASSWORD_RECOVERY_REDIRECT,
  PASSWORD_RECOVERY_REDIRECT_TO,
  getAuthEmailRedirectTo,
  getPasswordRecoveryRedirectTo,
} from './auth-redirect';
import {
  MIN_PASSWORD_LENGTH,
  authMessages,
  mapAuthCallbackError,
  mapSupabaseAuthError,
  validateAuthInput,
  validateNewPassword,
  validateRecoveryEmail,
} from './auth-errors';

describe('validateAuthInput', () => {
  it('requires email and password', () => {
    const error = validateAuthInput('', '');
    assert.equal(error?.code, 'VALIDATION');
    assert.equal(error?.message, authMessages.missingFields);
  });

  it('rejects invalid email', () => {
    const error = validateAuthInput('not-an-email', 'password12');
    assert.equal(error?.code, 'VALIDATION');
    assert.equal(error?.message, authMessages.invalidEmail);
  });

  it('rejects short passwords', () => {
    const error = validateAuthInput('user@nordyan.se', 'short');
    assert.equal(error?.code, 'VALIDATION');
    assert.equal(error?.message, authMessages.passwordTooShort);
    assert.equal(MIN_PASSWORD_LENGTH, 8);
  });

  it('accepts valid credentials', () => {
    assert.equal(validateAuthInput('user@nordyan.se', 'password12'), null);
  });
});

describe('mapSupabaseAuthError', () => {
  it('maps invalid login credentials', () => {
    const error = mapSupabaseAuthError({ message: 'Invalid login credentials' });
    assert.equal(error.code, 'UNAUTHORIZED');
    assert.equal(error.message, authMessages.invalidCredentials);
  });

  it('maps already registered users', () => {
    const error = mapSupabaseAuthError({ message: 'User already registered' });
    assert.equal(error.code, 'VALIDATION');
    assert.equal(error.message, authMessages.emailAlreadyRegistered);
  });

  it('maps unconfirmed email without exposing raw provider text', () => {
    const error = mapSupabaseAuthError({ message: 'Email not confirmed' });
    assert.equal(error.code, 'UNAUTHORIZED');
    assert.equal(error.message, authMessages.emailNotConfirmed);
    assert.equal(error.message.includes('Email not confirmed'), false);
    assert.equal(error.message.includes('produktion'), false);
    assert.equal(
      mapSupabaseAuthError({ code: 'email_not_confirmed' }).message,
      authMessages.emailNotConfirmed,
    );
  });

  it('falls back to the generic Swedish message', () => {
    const error = mapSupabaseAuthError({ message: 'unexpected upstream failure' });
    assert.equal(error.code, 'UNKNOWN');
    assert.equal(error.message, authMessages.generic);
  });
});

describe('password recovery validation', () => {
  it('validates recovery email and matching new passwords', () => {
    assert.equal(validateRecoveryEmail('user@example.com'), null);
    assert.equal(validateRecoveryEmail('invalid')?.message, authMessages.invalidEmail);
    assert.equal(validateNewPassword('password12', 'password12'), null);
    assert.equal(
      validateNewPassword('password12', 'different12')?.message,
      authMessages.passwordMismatch,
    );
  });
});

describe('mapAuthCallbackError', () => {
  it('maps expired OTP links', () => {
    const error = mapAuthCallbackError({ code: 'otp_expired', message: 'otp_expired' });
    assert.equal(error.message, authMessages.callbackExpired);
  });

  it('maps generic callback failures without raw provider text', () => {
    const error = mapAuthCallbackError({ message: 'unexpected upstream failure' });
    assert.equal(error.message, authMessages.callbackGeneric);
    assert.equal(error.message.includes('unexpected upstream'), false);
  });
});

describe('auth submit copy', () => {
  it('keeps sign-in and sign-up submitting labels', () => {
    assert.equal(authMessages.signingIn, 'Loggar in…');
    assert.equal(authMessages.signingUp, 'Skapar konto…');
  });

  it('uses concise unconfirmed sign-in copy', () => {
    assert.equal(authMessages.emailNotConfirmed, 'Bekräfta din e-postadress innan du loggar in.');
  });
});

describe('toSignUpOutcome', () => {
  it('treats session=null as pending verification success', () => {
    const outcome = toSignUpOutcome('user@nordyan.se', null, 'user-1');
    assert.deepEqual(outcome, {
      kind: 'pending_verification',
      email: 'user@nordyan.se',
      ownerId: 'user-1',
    });
  });

  it('keeps an authenticated session as a supported signup outcome', () => {
    const session = {
      user: { id: 'user-1', email: 'user@nordyan.se' },
      accessToken: 'token',
      expiresAt: null,
    };
    const outcome = toSignUpOutcome('user@nordyan.se', session, 'user-1');
    assert.equal(outcome.kind, 'authenticated');
    if (outcome.kind === 'authenticated') {
      assert.equal(outcome.session.user.id, 'user-1');
    }
  });
});

describe('auth email redirect', () => {
  it('uses the HTTPS website bridge for signup and resend', () => {
    assert.equal(AUTH_CALLBACK_PATH, '/auth/callback');
    assert.equal(EMAIL_VERIFICATION_WEB_REDIRECT, 'https://nordyan.app/auth/callback');
    assert.equal(AUTH_EMAIL_REDIRECT_TO, EMAIL_VERIFICATION_WEB_REDIRECT);
    assert.equal(getAuthEmailRedirectTo(), EMAIL_VERIFICATION_WEB_REDIRECT);
  });

  it('keeps the native email callback for the explicit website handoff', () => {
    assert.equal(EMAIL_VERIFICATION_NATIVE_CALLBACK, 'nordyan://auth/callback');
  });

  it('uses a separate callback URL for password recovery', () => {
    assert.equal(PASSWORD_RECOVERY_CALLBACK_PATH, '/auth/recovery-callback');
    assert.equal(PASSWORD_RECOVERY_REDIRECT, 'nordyan://auth/recovery-callback');
    assert.equal(PASSWORD_RECOVERY_REDIRECT_TO, PASSWORD_RECOVERY_REDIRECT);
    assert.equal(getPasswordRecoveryRedirectTo(), PASSWORD_RECOVERY_REDIRECT);
    assert.notEqual(PASSWORD_RECOVERY_REDIRECT, EMAIL_VERIFICATION_WEB_REDIRECT);
    assert.notEqual(PASSWORD_RECOVERY_REDIRECT, EMAIL_VERIFICATION_NATIVE_CALLBACK);
  });
});
