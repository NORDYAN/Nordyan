import type { Session } from '@supabase/supabase-js';

import type { Result } from '@/lib/core';
import type { AuthSession, AuthStatus, AuthUser, SignUpOutcome } from '@/lib/domain/auth';
import { logPkceStoragePresence } from '@/lib/presentation/auth-verification/pkce-storage-presence';
import type { AuthRepository } from '@/lib/repositories/auth.repository';
import {
  authMessages,
  mapAuthCallbackError,
  mapSupabaseAuthError,
} from '@/lib/services/auth/auth-errors';
import {
  getAuthEmailRedirectTo,
  getPasswordRecoveryRedirectTo,
} from '@/lib/services/auth/auth-redirect';
import { runPkceProviderOperation } from '@/lib/services/auth/pkce-provider-operation-lock';
import { toSignUpOutcome } from '@/lib/services/auth/to-sign-up-outcome';
import { logSignupForensics } from '@/lib/services/auth/signup-forensics';
import { getSupabaseClient } from '@/lib/supabase/client';

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
  constructor(
    private readonly clientProvider: typeof getSupabaseClient = getSupabaseClient,
  ) {}

  async getSession(): Promise<Result<AuthSession | null>> {
    const supabase = this.clientProvider();
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

  async getServerUser(): Promise<Result<AuthUser | null>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    const { data, error } = await supabase.auth.getUser();

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    return { ok: true, value: data.user ? mapUser(data.user) : null };
  }

  async signInWithEmail(email: string, password: string): Promise<Result<AuthSession>> {
    const supabase = this.clientProvider();
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

  async signUpWithEmail(email: string, password: string): Promise<Result<SignUpOutcome>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    const trimmedEmail = email.trim();
    return runPkceProviderOperation(
      'signup',
      async () => {
        logSignupForensics({
          stage: 'provider-request',
          signupProviderResult: 'not_attempted',
          outcome: 'not_determined',
          pendingBindResult: 'not_attempted',
          persistenceResult: 'not_attempted',
          profileOwnerState: 'unknown',
          lifestyleOwnerState: 'unknown',
        });
        const { data, error } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            emailRedirectTo: getAuthEmailRedirectTo(),
          },
        });
        await logPkceStoragePresence({ stage: 'after-signup' });

        if (error) {
          logSignupForensics({
            stage: 'provider-result',
            signupProviderResult: 'provider_error',
            providerError: error,
            outcome: 'failed',
            pendingBindResult: 'not_attempted',
            persistenceResult: 'not_attempted',
            profileOwnerState: 'unknown',
            lifestyleOwnerState: 'unknown',
          });
          return { ok: false as const, error: mapSupabaseAuthError(error) };
        }

        const providerResult = data.user
          ? data.session
            ? 'success_user_and_session'
            : 'success_user_without_session'
          : data.session
            ? 'success_session_without_user'
            : 'success_empty';
        logSignupForensics({
          stage: 'provider-result',
          signupProviderResult: providerResult,
          outcome: 'not_determined',
          pendingBindResult: 'not_attempted',
          persistenceResult: 'not_attempted',
          profileOwnerState: 'unknown',
          lifestyleOwnerState: 'unknown',
        });

        const ownerId = data.user?.id ?? data.session?.user.id;
        if (!ownerId) {
          logSignupForensics({
            stage: 'outcome-mapped',
            signupProviderResult: 'local_mapping_failed',
            outcome: 'failed',
            pendingBindResult: 'not_attempted',
            persistenceResult: 'not_attempted',
            profileOwnerState: 'unknown',
            lifestyleOwnerState: 'unknown',
          });
          return {
            ok: false as const,
            error: { code: 'UNKNOWN' as const, message: authMessages.generic },
          };
        }

        const outcome = toSignUpOutcome(
          trimmedEmail,
          data.session ? mapSession(data.session) : null,
          ownerId,
        );
        logSignupForensics({
          stage: 'outcome-mapped',
          signupProviderResult: providerResult,
          outcome: outcome.kind,
          pendingBindResult: 'not_attempted',
          persistenceResult: 'not_attempted',
          profileOwnerState: 'unknown',
          lifestyleOwnerState: 'unknown',
        });

        return {
          ok: true as const,
          value: outcome,
        };
      },
      () => ({
        ok: false as const,
        error: { code: 'UNKNOWN' as const, message: authMessages.generic },
      }),
    );
  }

  async resendSignupVerification(email: string): Promise<Result<void>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    return runPkceProviderOperation(
      'resend',
      async () => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: email.trim(),
          options: {
            emailRedirectTo: getAuthEmailRedirectTo(),
          },
        });

        if (error) {
          return { ok: false as const, error: mapSupabaseAuthError(error) };
        }

        return { ok: true as const, value: undefined };
      },
      () => ({
        ok: false as const,
        error: { code: 'UNKNOWN' as const, message: authMessages.generic },
      }),
    );
  }

  async requestPasswordRecovery(email: string): Promise<Result<void>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: getPasswordRecoveryRedirectTo(),
    });

    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    return { ok: true, value: undefined };
  }

  async exchangeAuthCallbackCode(code: string): Promise<Result<AuthSession>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    const trimmedCode = code.trim();
    if (!trimmedCode) {
      return {
        ok: false,
        error: { code: 'VALIDATION', message: authMessages.callbackExpired },
      };
    }

    const { data, error } = await supabase.auth.exchangeCodeForSession(trimmedCode);

    if (error) {
      return { ok: false, error: mapAuthCallbackError(error) };
    }

    if (!data.session) {
      return {
        ok: false,
        error: { code: 'UNAUTHORIZED', message: authMessages.callbackGeneric },
      };
    }

    return { ok: true, value: mapSession(data.session) };
  }

  async updatePassword(password: string): Promise<Result<void>> {
    const supabase = this.clientProvider();
    if (!supabase) {
      return missingConfigError();
    }

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      return { ok: false, error: mapSupabaseAuthError(error) };
    }

    return { ok: true, value: undefined };
  }

  async signOut(): Promise<Result<void>> {
    const supabase = this.clientProvider();
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
