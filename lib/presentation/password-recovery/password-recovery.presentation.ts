import type { Result } from '@/lib/core';
import type { AuthSession } from '@/lib/domain/auth';
import { authMessages } from '@/lib/services/auth/auth-errors';

export const PASSWORD_RECOVERY_COOLDOWN_MS = 60_000;

function firstParam(value: string | string[] | undefined): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  if (Array.isArray(value) && typeof value[0] === 'string') {
    const trimmed = value[0].trim();
    return trimmed ? trimmed : null;
  }
  return null;
}

export function canRequestPasswordRecoveryAgain(
  lastSentAtMs: number | null,
  nowMs: number,
): boolean {
  return lastSentAtMs === null || nowMs - lastSentAtMs >= PASSWORD_RECOVERY_COOLDOWN_MS;
}

export type PasswordRecoveryCallbackParams = {
  code?: string | string[];
  error?: string | string[];
  error_code?: string | string[];
};

export type PasswordRecoveryCallbackResult =
  | { kind: 'code'; code: string }
  | { kind: 'invalid' };

export function parsePasswordRecoveryCallbackParams(
  params: PasswordRecoveryCallbackParams,
): PasswordRecoveryCallbackResult {
  if (firstParam(params.error) || firstParam(params.error_code)) {
    return { kind: 'invalid' };
  }
  const code = firstParam(params.code);
  return code ? { kind: 'code', code } : { kind: 'invalid' };
}

export async function completePasswordRecoveryCallback(input: {
  params: PasswordRecoveryCallbackParams;
  exchangeCode: (code: string) => Promise<Result<AuthSession>>;
}): Promise<Result<AuthSession>> {
  const parsed = parsePasswordRecoveryCallbackParams(input.params);
  if (parsed.kind === 'invalid') {
    return {
      ok: false,
      error: { code: 'UNAUTHORIZED', message: authMessages.recoveryInvalid },
    };
  }

  let exchanged: Result<AuthSession>;
  try {
    exchanged = await input.exchangeCode(parsed.code);
  } catch {
    return {
      ok: false,
      error: { code: 'NETWORK', message: authMessages.recoveryInvalid },
    };
  }
  if (!exchanged.ok) {
    return {
      ok: false,
      error: {
        code: exchanged.error.code,
        message: authMessages.recoveryInvalid,
      },
    };
  }

  return exchanged;
}
