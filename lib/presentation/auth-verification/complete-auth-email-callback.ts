import type { AppError, Result } from '@/lib/core';
import type { AuthSession } from '@/lib/domain/auth';
import { t } from '@/lib/i18n';
import type { SyncPendingProfileResult } from '@/lib/onboarding/sync-pending-profile';
import type { PersistPendingInitialLifestyleResult } from '@/lib/onboarding/persist-pending-initial-lifestyle';
import { authMessages } from '@/lib/services/auth/auth-errors';

import {
  buildAuthCallbackFailureDiagnostic,
  type AuthCallbackFailureDiagnostic,
} from './auth-callback-failure-diagnostic';
import { parseAuthCallbackParams } from './auth-verification.presentation';

export type CompleteAuthEmailCallbackDeps = {
  params: {
    code?: string | string[];
    error?: string | string[];
  };
  getSession: () => Promise<Result<AuthSession | null>>;
  exchangeCode: (code: string) => Promise<Result<AuthSession>>;
  syncPendingProfile: () => Promise<SyncPendingProfileResult>;
  persistPendingLifestyle: (userId: string) => Promise<PersistPendingInitialLifestyleResult>;
  clearCompletedOnboardingLocalData: (userId: string) => Promise<void>;
};

export type CompleteAuthEmailCallbackResult =
  | { ok: true; value: { userId: string } }
  | { ok: false; error: AppError; diagnostic: AuthCallbackFailureDiagnostic };

type ExchangeAttemptState = {
  exchangeAttempted: boolean;
  exchangeSucceeded: boolean;
};

function toPersistFailure(error?: AppError): Result<never> {
  return {
    ok: false,
    error: {
      code: error?.code ?? 'UNKNOWN',
      message: error?.message || t('onboarding.syncError'),
    },
  };
}

function failedCallback(
  error: AppError,
  diagnostic: Omit<Parameters<typeof buildAuthCallbackFailureDiagnostic>[0], 'error'> & {
    error?: AppError;
  },
): CompleteAuthEmailCallbackResult {
  return {
    ok: false,
    error,
    diagnostic: buildAuthCallbackFailureDiagnostic({
      ...diagnostic,
      error: diagnostic.error ?? error,
    }),
  };
}

async function persistAfterSession(
  session: AuthSession,
  deps: Pick<
    CompleteAuthEmailCallbackDeps,
    'syncPendingProfile' | 'persistPendingLifestyle' | 'clearCompletedOnboardingLocalData'
  >,
  exchange: ExchangeAttemptState,
): Promise<CompleteAuthEmailCallbackResult> {
  const profile = await deps.syncPendingProfile();
  if (!profile.ok) {
    const failure = toPersistFailure(profile.error);
    return failedCallback(failure.error, {
      failureStage: 'profile_persist',
      persistStage: 'profile',
      persistReason: profile.reason,
      error: {
        ...failure.error,
        cause: profile.error?.cause ?? profile.error,
      },
      ...exchange,
    });
  }

  const lifestyle = await deps.persistPendingLifestyle(session.user.id);
  if (!lifestyle.ok) {
    return failedCallback(lifestyle.error, {
      failureStage: 'lifestyle_persist',
      persistStage: 'lifestyle',
      ...exchange,
    });
  }

  await deps.clearCompletedOnboardingLocalData(session.user.id);
  return { ok: true, value: { userId: session.user.id } };
}

export async function completeAuthEmailCallback(
  deps: CompleteAuthEmailCallbackDeps,
): Promise<CompleteAuthEmailCallbackResult> {
  const existing = await deps.getSession();
  if (existing.ok && existing.value) {
    return persistAfterSession(existing.value, deps, {
      exchangeAttempted: false,
      exchangeSucceeded: false,
    });
  }

  const parsed = parseAuthCallbackParams(deps.params);
  if (parsed.kind === 'invalid') {
    const error = { code: 'VALIDATION' as const, message: authMessages.callbackExpired };
    return failedCallback(error, {
      failureStage: 'invalid_params',
      persistStage: 'none',
      exchangeAttempted: false,
      exchangeSucceeded: false,
    });
  }

  const exchanged = await deps.exchangeCode(parsed.code);
  if (!exchanged.ok) {
    return failedCallback(exchanged.error, {
      failureStage: 'exchange',
      persistStage: 'none',
      exchangeAttempted: true,
      exchangeSucceeded: false,
    });
  }

  return persistAfterSession(exchanged.value, deps, {
    exchangeAttempted: true,
    exchangeSucceeded: true,
  });
}