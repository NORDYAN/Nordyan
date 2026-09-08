import type { AppError, Result } from '@/lib/core';
import type { AuthSession } from '@/lib/domain/auth';

export type AuthHydrationErrorClass = 'none' | 'stale_invalid' | 'transient_error';

export type HydratedAuthSession = {
  session: AuthSession | null;
  status: 'authenticated' | 'unauthenticated';
  shouldClearLocalSession: boolean;
  errorClass: AuthHydrationErrorClass;
};

function errorText(error: AppError): { code: string; message: string; status: number | null } {
  const cause = error.cause;
  const status =
    cause && typeof cause === 'object' && 'status' in cause && typeof cause.status === 'number'
      ? cause.status
      : null;
  const causeCode =
    cause && typeof cause === 'object' && 'code' in cause && typeof cause.code === 'string'
      ? cause.code
      : '';
  const causeMessage =
    cause && typeof cause === 'object' && 'message' in cause && typeof cause.message === 'string'
      ? cause.message
      : '';

  return {
    code: `${error.code} ${causeCode}`.toLowerCase(),
    message: `${error.message} ${causeMessage}`.toLowerCase(),
    status,
  };
}

export function classifyAuthServerUserFailure(error: AppError): AuthHydrationErrorClass {
  if (error.code === 'NETWORK' || error.code === 'INTEGRATION') {
    return 'transient_error';
  }

  const { code, message, status } = errorText(error);

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('timeout') ||
    message.includes('timed out') ||
    message.includes('failed to fetch') ||
    code.includes('fetch_error') ||
    status === 429 ||
    (status !== null && status >= 500)
  ) {
    return 'transient_error';
  }

  if (message.includes('email not confirmed') || code.includes('email_not_confirmed')) {
    return 'transient_error';
  }

  if (
    status === 401 ||
    status === 403 ||
    code.includes('user_not_found') ||
    code.includes('session_not_found') ||
    message.includes('user not found') ||
    message.includes('does not exist') ||
    message.includes('invalid jwt') ||
    message.includes('invalid claim') ||
    message.includes('session_not_found') ||
    message.includes('auth session missing') ||
    message.includes('invalid token')
  ) {
    return 'stale_invalid';
  }

  if (error.code === 'UNAUTHORIZED' || error.code === 'NOT_FOUND') {
    return 'stale_invalid';
  }

  return 'transient_error';
}

export function resolveHydratedAuthSession(input: {
  localSession: Result<AuthSession | null>;
  serverUser: Result<{ id: string } | null> | null;
}): HydratedAuthSession {
  if (!input.localSession.ok) {
    return {
      session: null,
      status: 'unauthenticated',
      shouldClearLocalSession: false,
      errorClass: 'none',
    };
  }

  const local = input.localSession.value;
  if (!local) {
    return {
      session: null,
      status: 'unauthenticated',
      shouldClearLocalSession: false,
      errorClass: 'none',
    };
  }

  if (!input.serverUser) {
    return {
      session: local,
      status: 'authenticated',
      shouldClearLocalSession: false,
      errorClass: 'transient_error',
    };
  }

  if (input.serverUser.ok) {
    const serverId = input.serverUser.value?.id?.trim() ?? '';
    if (serverId && serverId === local.user.id) {
      return {
        session: local,
        status: 'authenticated',
        shouldClearLocalSession: false,
        errorClass: 'none',
      };
    }

    return {
      session: null,
      status: 'unauthenticated',
      shouldClearLocalSession: true,
      errorClass: 'stale_invalid',
    };
  }

  const errorClass = classifyAuthServerUserFailure(input.serverUser.error);
  if (errorClass === 'transient_error') {
    return {
      session: local,
      status: 'authenticated',
      shouldClearLocalSession: false,
      errorClass,
    };
  }

  return {
    session: null,
    status: 'unauthenticated',
    shouldClearLocalSession: true,
    errorClass,
  };
}
