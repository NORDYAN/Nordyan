import { createClient } from '@supabase/supabase-js';

import type { AccountServerConfig } from './config';
import { isAccountAdminConfigured } from './config';

export type DeleteAuthUserResult =
  | { ok: true; alreadyDeleted: boolean }
  | { ok: false; reason: 'not_configured' | 'delete_failed' };

export type AuthUserDeleter = (userId: string) => Promise<DeleteAuthUserResult>;

export function isUserNotFoundError(error: {
  status?: number;
  code?: string;
  message?: string;
} | null): boolean {
  if (!error) {
    return false;
  }

  const status = error.status;
  const code = (error.code ?? '').toLowerCase();
  const message = (error.message ?? '').toLowerCase();

  return (
    status === 404 ||
    code === 'user_not_found' ||
    message.includes('user not found') ||
    (message.includes('not found') && message.includes('user'))
  );
}

export function createSupabaseAuthUserDeleter(config: AccountServerConfig): AuthUserDeleter {
  return async (userId: string) => {
    if (!isAccountAdminConfigured(config)) {
      return { ok: false, reason: 'not_configured' };
    }

    const supabaseAdmin = createClient(config.supabaseUrl!, config.supabaseServiceRoleKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (!error) {
      return { ok: true, alreadyDeleted: false };
    }

    if (isUserNotFoundError(error)) {
      return { ok: true, alreadyDeleted: true };
    }

    return { ok: false, reason: 'delete_failed' };
  };
}
