import type { AppError } from '@/lib/core';
import { liveCopy, t } from '@/lib/i18n';

const MIN_PASSWORD_LENGTH = 8;

export { MIN_PASSWORD_LENGTH };

export const authMessages = liveCopy({
  signingIn: () => t('auth.signIn.loading'),
  signingUp: () => t('auth.signUp.loading'),
  invalidCredentials: () => t('auth.error.invalidCredentials'),
  emailAlreadyRegistered: () => t('auth.error.emailAlreadyRegistered'),
  passwordTooShort: () => t('auth.error.passwordTooShort', { min: MIN_PASSWORD_LENGTH }),
  invalidEmail: () => t('auth.error.invalidEmail'),
  missingFields: () => t('auth.error.missingFields'),
  emailNotConfirmed: () => t('auth.error.emailNotConfirmed'),
  callbackExpired: () => t('auth.error.callbackExpired'),
  callbackGeneric: () => t('auth.error.callbackGeneric'),
  missingConfig: () => t('auth.error.missingConfig'),
  generic: () => t('auth.error.generic'),
  signOutFailed: () => t('auth.error.signOutFailed'),
  passwordMismatch: () => t('auth.recovery.error.passwordMismatch'),
  recoveryInvalid: () => t('auth.recovery.error.invalidLink'),
  recoverySessionRequired: () => t('auth.recovery.error.sessionRequired'),
  recoveryMissingPasswords: () => t('auth.recovery.error.missingPasswords'),
});

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function validateRecoveryEmail(email: string): AppError | null {
  if (!isValidEmail(email)) {
    return { code: 'VALIDATION', message: authMessages.invalidEmail };
  }
  return null;
}

export function validateNewPassword(password: string, confirmation: string): AppError | null {
  if (!password || !confirmation) {
    return { code: 'VALIDATION', message: authMessages.recoveryMissingPasswords };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { code: 'VALIDATION', message: authMessages.passwordTooShort };
  }
  if (password !== confirmation) {
    return { code: 'VALIDATION', message: authMessages.passwordMismatch };
  }
  return null;
}

export function validateAuthInput(email: string, password: string): AppError | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    return { code: 'VALIDATION', message: authMessages.missingFields };
  }

  if (!isValidEmail(trimmedEmail)) {
    return { code: 'VALIDATION', message: authMessages.invalidEmail };
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { code: 'VALIDATION', message: authMessages.passwordTooShort };
  }

  return null;
}

export function mapSupabaseAuthError(error: unknown): AppError {
  if (!error || typeof error !== 'object') {
    return { code: 'UNKNOWN', message: authMessages.generic, cause: error };
  }

  const authError = error as { message?: string; code?: string; status?: number };
  const message = authError.message?.toLowerCase() ?? '';
  const code = authError.code?.toLowerCase() ?? '';

  if (
    message.includes('invalid login credentials') ||
    code === 'invalid_credentials'
  ) {
    return { code: 'UNAUTHORIZED', message: authMessages.invalidCredentials, cause: error };
  }

  if (
    message.includes('user already registered') ||
    code === 'user_already_exists' ||
    message.includes('already been registered')
  ) {
    return { code: 'VALIDATION', message: authMessages.emailAlreadyRegistered, cause: error };
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return { code: 'UNAUTHORIZED', message: authMessages.emailNotConfirmed, cause: error };
  }

  if (message.includes('invalid email') || message.includes('valid email')) {
    return { code: 'VALIDATION', message: authMessages.invalidEmail, cause: error };
  }

  if (
    message.includes('password') &&
    (message.includes('short') || message.includes('least') || message.includes('weak'))
  ) {
    return { code: 'VALIDATION', message: authMessages.passwordTooShort, cause: error };
  }

  return { code: 'UNKNOWN', message: authMessages.generic, cause: error };
}

export function mapAuthCallbackError(error: unknown): AppError {
  if (!error || typeof error !== 'object') {
    return { code: 'UNKNOWN', message: authMessages.callbackGeneric, cause: error };
  }

  const authError = error as { message?: string; code?: string; status?: number };
  const message = authError.message?.toLowerCase() ?? '';
  const code = authError.code?.toLowerCase() ?? '';

  if (
    code === 'otp_expired' ||
    message.includes('otp_expired') ||
    message.includes('expired') ||
    message.includes('invalid token') ||
    message.includes('invalid or has expired') ||
    authError.status === 403
  ) {
    return { code: 'UNAUTHORIZED', message: authMessages.callbackExpired, cause: error };
  }

  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return { code: 'UNAUTHORIZED', message: authMessages.emailNotConfirmed, cause: error };
  }

  return { code: 'UNKNOWN', message: authMessages.callbackGeneric, cause: error };
}
