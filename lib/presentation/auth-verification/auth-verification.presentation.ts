import { liveCopy, t } from '@/lib/i18n';

export const AUTH_VERIFICATION_COPY = liveCopy({
  checkEmailHeading: () => t('auth.checkEmail.heading'),
  checkEmailBody: () => t('auth.checkEmail.body'),
  checkEmailInstruction: () => t('auth.checkEmail.instruction'),
  resend: () => t('auth.checkEmail.resend'),
  resendSubmitting: () => t('auth.checkEmail.resendSubmitting'),
  resendSuccess: () => t('auth.checkEmail.resendSuccess'),
  returnToSignIn: () => t('auth.checkEmail.returnToSignIn'),
  useAnotherEmail: () => t('auth.checkEmail.useAnotherEmail'),
  callbackLoading: () => t('auth.callback.loading'),
});

export const AUTH_RESEND_COOLDOWN_MS = 60_000;

export function buildCheckEmailBody(): string {
  return t('auth.checkEmail.body');
}

export function maskEmailAddress(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.lastIndexOf('@');
  if (at <= 0 || at === trimmed.length - 1) {
    return trimmed;
  }

  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = local.slice(0, 1);
  return `${visible}***@${domain}`;
}

export function canResendVerification(lastSentAtMs: number | null, nowMs: number): boolean {
  if (lastSentAtMs == null) {
    return true;
  }

  return nowMs - lastSentAtMs >= AUTH_RESEND_COOLDOWN_MS;
}

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value) && typeof value[0] === 'string') {
    const trimmed = value[0].trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  return null;
}

export type AuthCallbackParseResult =
  | { kind: 'code'; code: string }
  | { kind: 'invalid' };

export type AuthCallbackParamsInput = {
  code?: string | string[];
  error?: string | string[];
};

/**
 * Deep-link search params can arrive after the callback screen mounts.
 * Missing code/error means "not ready yet", not an auth failure.
 */
export function hasActionableAuthCallbackParams(input: AuthCallbackParamsInput): boolean {
  return firstParam(input.code) !== null || firstParam(input.error) !== null;
}

export type AuthCallbackStartDecision = { action: 'wait' } | { action: 'start' };

/** One-shot start gate for the callback screen effect. */
export function decideAuthCallbackStart(input: {
  alreadyStarted: boolean;
  params: AuthCallbackParamsInput;
}): AuthCallbackStartDecision {
  if (input.alreadyStarted) {
    return { action: 'wait' };
  }

  if (!hasActionableAuthCallbackParams(input.params)) {
    return { action: 'wait' };
  }

  return { action: 'start' };
}

export function parseAuthCallbackParams(input: AuthCallbackParamsInput): AuthCallbackParseResult {
  if (firstParam(input.error)) {
    return { kind: 'invalid' };
  }

  const code = firstParam(input.code);
  if (!code) {
    return { kind: 'invalid' };
  }

  return { kind: 'code', code };
}

export function parseAuthCallbackUrl(url: string): AuthCallbackParseResult {
  try {
    const parsed = new URL(url);
    return parseAuthCallbackParams({
      code: parsed.searchParams.get('code') ?? undefined,
      error: parsed.searchParams.get('error') ?? undefined,
    });
  } catch {
    return { kind: 'invalid' };
  }
}
