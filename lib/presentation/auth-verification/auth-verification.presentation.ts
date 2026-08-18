import { liveCopy, t } from '@/lib/i18n';

export const AUTH_VERIFICATION_COPY = liveCopy({
  checkEmailHeading: () => t('auth.checkEmail.heading'),
  checkEmailInstruction: () => t('auth.checkEmail.instruction'),
  resend: () => t('auth.checkEmail.resend'),
  resendSubmitting: () => t('auth.checkEmail.resendSubmitting'),
  resendSuccess: () => t('auth.checkEmail.resendSuccess'),
  returnToSignIn: () => t('auth.checkEmail.returnToSignIn'),
  callbackLoading: () => t('auth.callback.loading'),
});

export const AUTH_RESEND_COOLDOWN_MS = 60_000;

export function buildCheckEmailBody(maskedEmail: string): string {
  return t('auth.checkEmail.body', { email: maskedEmail });
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

export function parseAuthCallbackParams(input: {
  code?: string | string[];
  error?: string | string[];
}): AuthCallbackParseResult {
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
