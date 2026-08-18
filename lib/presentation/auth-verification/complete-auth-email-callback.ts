import type { AppError, Result } from '@/lib/core';
import type { AuthSession } from '@/lib/domain/auth';
import { t } from '@/lib/i18n';
import type { SyncPendingProfileResult } from '@/lib/onboarding/sync-pending-profile';
import type { PersistPendingInitialLifestyleResult } from '@/lib/onboarding/persist-pending-initial-lifestyle';
import { authMessages } from '@/lib/services/auth/auth-errors';

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

function toPersistFailure(error?: AppError): Result<never> {
  return {
    ok: false,
    error: {
      code: error?.code ?? 'UNKNOWN',
      message: error?.message || t('onboarding.syncError'),
    },
  };
}

async function persistAfterSession(
  session: AuthSession,
  deps: Pick<
    CompleteAuthEmailCallbackDeps,
    'syncPendingProfile' | 'persistPendingLifestyle' | 'clearCompletedOnboardingLocalData'
  >,
): Promise<Result<{ userId: string }>> {
  const profile = await deps.syncPendingProfile();
  if (!profile.ok) {
    return toPersistFailure(profile.error);
  }

  const lifestyle = await deps.persistPendingLifestyle(session.user.id);
  if (!lifestyle.ok) {
    return lifestyle;
  }

  await deps.clearCompletedOnboardingLocalData(session.user.id);
  return { ok: true, value: { userId: session.user.id } };
}

export async function completeAuthEmailCallback(
  deps: CompleteAuthEmailCallbackDeps,
): Promise<Result<{ userId: string }>> {
  const existing = await deps.getSession();
  if (existing.ok && existing.value) {
    return persistAfterSession(existing.value, deps);
  }

  const parsed = parseAuthCallbackParams(deps.params);
  if (parsed.kind === 'invalid') {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: authMessages.callbackExpired },
    };
  }

  const exchanged = await deps.exchangeCode(parsed.code);
  if (!exchanged.ok) {
    return exchanged;
  }

  return persistAfterSession(exchanged.value, deps);
}