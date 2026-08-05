import type { Session } from '@supabase/supabase-js';

import type { Result } from '@/lib/core';
import { authMessages } from '@/lib/services/auth/auth-errors';
import type { AuthSession, AuthStatus, AuthUser } from '@/lib/domain/auth';
import type { AuthRepository } from '@/lib/repositories/auth.repository';
import { getSupabaseClient } from '@/lib/supabase/client';
import { mapSupabaseAuthError } from '@/lib/services/auth/auth-errors';

function mapUser(user: Session['user']): AuthUser {
  return {
    id: user.id,
    email: user.email ?? null,
  };
}

function mapSession(session: Session): AuthSession {
  return {
    user: mapUser(session.user),
    accessToken: session.access_token,
    expiresAt: session.expires_at ? session.expires_at * 1000 : null,
  };
}

function missingConfigError(): Result<never> {
  return {
    ok: false,
    error: {
      code: 'INTEGRATION',
      message: authMessages.missingConfig,
    },
  };
}

export class SupabaseAuthRepository implements AuthRepository {
  async getSession(): Promise<Result<AuthSession | null>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return missingConfigError();
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    return { ok: true, value: data.session ? mapSession(data.session) : null };
  }

  async getStatus(): Promise<Result<AuthStatus>> {
    const sessionResult = await this.getSession();

    if (!sessionResult.ok) {
      if (sessionResult.error.code === 'INTEGRATION') {
        return { ok: true, value: 'unauthenticated' };
      }

      return sessionResult;
    }

    return {
      ok: true,
      value: sessionResult.value ? 'authenticated' : 'unauthenticated',
    };
  }

  async getCurrentUser(): Promise<Result<AuthUser | null>> {
    const sessionResult = await this.getSession();

    if (!sessionResult.ok) {
      return sessionResult;
    }

    return { ok: true, value: sessionResult.value?.user ?? null };
  }

  async signInWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return missingConfigError();
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    if (!data.session) {
      return {
        ok: false,
        error: { code: 'UNKNOWN', message: authMessages.generic },
      };
    }

    return { ok: true, value: mapSession(data.session) };
  }

  async signUpWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return missingConfigError();
    }

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    if (!data.session) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: authMessages.emailNotConfirmed },
      };
    }

    return { ok: true, value: mapSession(data.session) };
  }

  async signOut(): Promise<Result<void>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return missingConfigError();
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    return { ok: true, value: undefined };
  }
}

export const supabaseAuthRepository = new SupabaseAuthRepository();
