import type { AppError } from '@/lib/core';
import { t } from '@/lib/i18n';

import { requestAccountDelete } from './client';

export type DeleteAccountSession = {
  userId: string;
  accessToken: string;
};

export type DeleteAccountAuthClient = {
  signOut(): Promise<{ ok: true } | { ok: false; error: AppError }>;
};

export type DeleteCurrentAccountResult =
  | { ok: true }
  | { ok: false; error: AppError };

function deletionFailedError(): AppError {
  return { code: 'UNKNOWN', message: t('profile.privacy.delete.error') };
}

/**
 * Server deletion first. Local wipe and sign-out run only after success
 * (including idempotent already-deleted). Local cleanup is best-effort.
 */
export async function deleteCurrentAccount(input: {
  session: DeleteAccountSession | null;
  authClient: DeleteAccountAuthClient;
  requestDelete?: typeof requestAccountDelete;
  clearLocalData: (userId: string) => Promise<void>;
}): Promise<DeleteCurrentAccountResult> {
  const userId = input.session?.userId?.trim() ?? '';
  const accessToken = input.session?.accessToken?.trim() ?? '';
  if (!userId || !accessToken) {
    return { ok: false, error: deletionFailedError() };
  }

  const requestDelete = input.requestDelete ?? requestAccountDelete;
  const serverResult = await requestDelete({ accessToken });
  if (!serverResult.ok) {
    return { ok: false, error: deletionFailedError() };
  }

  try {
    await input.clearLocalData(userId);
  } catch {
    // Best-effort. Server already deleted the account.
  }

  const signOutResult = await input.authClient.signOut();
  if (!signOutResult.ok) {
    // Session may already be invalid because the Auth user is gone.
  }

  return { ok: true };
}
