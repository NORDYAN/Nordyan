import type { AppError } from '@/lib/core';

export type AuthCallbackFailureStage =
  | 'invalid_params'
  | 'exchange'
  | 'profile_persist'
  | 'lifestyle_persist';

export type AuthCallbackPersistStage = 'none' | 'profile' | 'lifestyle';

export type AuthCallbackFailureDiagnostic = {
  failureStage: AuthCallbackFailureStage;
  exchangeAttempted: boolean;
  exchangeSucceeded: boolean;
  persistStage: AuthCallbackPersistStage;
  persistReason: string | null;
  errorCode: string;
  causeCode: string | null;
  causeStatus: number | null;
  causeMessage: string | null;
};

const SECRET_MESSAGE_PATTERN =
  /access_token|refresh_token|code_verifier|authorization.?code|\bbearer\b|\beyJ[A-Za-z0-9_-]{10,}/i;

function asFiniteStatus(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeCauseMessage(message: string | null): string | null {
  if (!message) {
    return null;
  }
  if (SECRET_MESSAGE_PATTERN.test(message)) {
    return '[redacted]';
  }
  return message.slice(0, 300);
}

export function readAuthCallbackCauseFields(error?: AppError | null): {
  causeCode: string | null;
  causeStatus: number | null;
  causeMessage: string | null;
} {
  const cause = error?.cause;
  if (!cause || typeof cause !== 'object') {
    return { causeCode: null, causeStatus: null, causeMessage: null };
  }

  const record = cause as { code?: unknown; status?: unknown; message?: unknown };
  return {
    causeCode: asNonEmptyString(record.code),
    causeStatus: asFiniteStatus(record.status),
    causeMessage: sanitizeCauseMessage(asNonEmptyString(record.message)),
  };
}

export function buildAuthCallbackFailureDiagnostic(input: {
  failureStage: AuthCallbackFailureStage;
  exchangeAttempted: boolean;
  exchangeSucceeded: boolean;
  persistStage: AuthCallbackPersistStage;
  persistReason?: string | null;
  error: AppError;
}): AuthCallbackFailureDiagnostic {
  return {
    failureStage: input.failureStage,
    exchangeAttempted: input.exchangeAttempted,
    exchangeSucceeded: input.exchangeSucceeded,
    persistStage: input.persistStage,
    persistReason: input.persistReason ?? null,
    errorCode: input.error.code,
    ...readAuthCallbackCauseFields(input.error),
  };
}

export function toAuthCallbackFailureTraceDetails(
  diagnostic: AuthCallbackFailureDiagnostic,
  sessionAfter: boolean,
): Record<string, string | number | boolean | null> {
  return {
    result: 'failure',
    failureStage: diagnostic.failureStage,
    exchangeAttempted: diagnostic.exchangeAttempted,
    exchangeSucceeded: diagnostic.exchangeSucceeded,
    persistStage: diagnostic.persistStage,
    persistReason: diagnostic.persistReason,
    errorCode: diagnostic.errorCode,
    causeCode: diagnostic.causeCode,
    causeStatus: diagnostic.causeStatus,
    sessionAfter,
    causeMessage: diagnostic.causeMessage,
  };
}
