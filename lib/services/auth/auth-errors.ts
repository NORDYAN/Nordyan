import type { AppError } from '@/lib/core';

const MIN_PASSWORD_LENGTH = 8;

export { MIN_PASSWORD_LENGTH };

export const authMessages = {
  signingIn: 'Loggar in…',
  signingUp: 'Skapar konto…',
  invalidCredentials: 'Fel e-post eller lösenord.',
  emailAlreadyRegistered: 'E-postadressen är redan registrerad.',
  passwordTooShort: `Lösenordet måste vara minst ${MIN_PASSWORD_LENGTH} tecken.`,
  invalidEmail: 'Ange en giltig e-postadress.',
  missingFields: 'Fyll i e-post och lösenord.',
  emailNotConfirmed:
    'Bekräfta din e-postadress innan du loggar in. E-postverifiering krävs i produktion.',
  missingConfig:
    'Supabase är inte konfigurerat. Lägg till EXPO_PUBLIC_SUPABASE_URL och EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY (eller EXPO_PUBLIC_SUPABASE_ANON_KEY) i .env.',
  generic: 'Något gick fel. Försök igen.',
  signOutFailed: 'Kunde inte logga ut. Försök igen.',
} as const;

export function validateAuthInput(email: string, password: string): AppError | null {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    return { code: 'VALIDATION', message: authMessages.missingFields };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
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

  if (message.includes('email not confirmed')) {
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
