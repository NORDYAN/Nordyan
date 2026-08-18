import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import type { AppError } from '@/lib/core';
import { isSupabaseConfigured } from '@/lib/core/config/env';
import type { AuthSession, AuthStatus, SignUpOutcome } from '@/lib/domain/auth';
import {
  captureOnboardingForensicsSnapshot,
  emitOnboardingForensics,
} from '@/lib/onboarding/onboarding-forensics-emit';
import {
  bindPendingOnboardingToUser,
  clearCompletedOnboardingLocalData,
  clearCurrentUserPendingOnboardingLeftover,
  clearUnownedPendingOnboardingForExistingSignIn,
} from '@/lib/onboarding/pending-onboarding-ownership';
import { persistPendingInitialLifestyleAfterAuth } from '@/lib/onboarding/pending-initial-lifestyle-storage';
import {
  savePendingSignupVerification,
  clearPendingSignupVerification,
} from '@/lib/onboarding/pending-signup-verification-storage';
import { syncPendingProfileAfterAuth } from '@/lib/onboarding/sync-pending-profile-runtime';
import { authMessages } from '@/lib/services/auth/auth-errors';
import { authService } from '@/lib/services/auth/auth.service';
import {
  logSignupForensics,
  type SignupForensicsOutcome,
  type SignupForensicsStage,
  type SignupPendingBindResult,
  type SignupPendingOwnerState,
  type SignupPersistenceResult,
  type SignupProviderResultCategory,
} from '@/lib/services/auth/signup-forensics';
import { getSupabaseClient } from '@/lib/supabase/client';

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  isReady: boolean;
  isConfigured: boolean;
  isPasswordRecovery: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<{ ok: true; outcome: SignUpOutcome } | { ok: false; error: AppError }>;
  resendSignupVerification: (email: string) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  requestPasswordRecovery: (email: string) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  activatePasswordRecovery: (session: AuthSession) => void;
  updateRecoveredPassword: (
    password: string,
    confirmation: string,
  ) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  signOut: () => Promise<{ ok: true } | { ok: false; error: AppError }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function emitSignupForensics(input: {
  stage: SignupForensicsStage;
  signupProviderResult: SignupProviderResultCategory;
  providerError?: unknown;
  outcome: SignupForensicsOutcome;
  pendingBindResult: SignupPendingBindResult;
  persistenceResult: SignupPersistenceResult;
  viewerUserId?: string | null;
}): Promise<void> {
  if (typeof __DEV__ === 'undefined' || !__DEV__) {
    return;
  }

  let profileOwnerState: SignupPendingOwnerState = 'unknown';
  let lifestyleOwnerState: SignupPendingOwnerState = 'unknown';
  try {
    const snapshot = await captureOnboardingForensicsSnapshot(input.viewerUserId ?? null);
    profileOwnerState = snapshot.profileOwnerState;
    lifestyleOwnerState = snapshot.lifestyleOwnerState;
  } catch {
    // Signup diagnostics must never alter the auth result.
  }

  logSignupForensics({
    stage: input.stage,
    signupProviderResult: input.signupProviderResult,
    providerError: input.providerError,
    outcome: input.outcome,
    pendingBindResult: input.pendingBindResult,
    persistenceResult: input.persistenceResult,
    profileOwnerState,
    lifestyleOwnerState,
  });
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isSupabaseConfigured();
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  useEffect(() => {
    if (!isConfigured) {
      setStatus('unauthenticated');
      setSession(null);
      setIsReady(true);
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setStatus('unauthenticated');
      setSession(null);
      setIsReady(true);
      return;
    }

    let isMounted = true;

    const syncSession = async () => {
      const result = await authService.getSession();

      if (!isMounted) {
        return;
      }

      if (result.ok) {
        setSession(result.value);
        setStatus(result.value ? 'authenticated' : 'unauthenticated');
      } else {
        setSession(null);
        setStatus('unauthenticated');
      }

      setIsReady(true);
    };

    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!isMounted) {
        return;
      }

      if (nextSession) {
        setSession({
          user: {
            id: nextSession.user.id,
            email: nextSession.user.email ?? null,
          },
          accessToken: nextSession.access_token,
          expiresAt: nextSession.expires_at ? nextSession.expires_at * 1000 : null,
        });
        setStatus('authenticated');
        if (event === 'PASSWORD_RECOVERY') {
          setIsPasswordRecovery(true);
        }
      } else {
        setSession(null);
        setStatus('unauthenticated');
        setIsPasswordRecovery(false);
      }

      setIsReady(true);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured]);

  useEffect(() => {
    if (!isConfigured) {
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }

    const handleAppStateChange = (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void supabase.auth.startAutoRefresh();
      } else {
        void supabase.auth.stopAutoRefresh();
      }
    };

    if (AppState.currentState === 'active') {
      void supabase.auth.startAutoRefresh();
    }

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      void supabase.auth.stopAutoRefresh();
    };
  }, [isConfigured]);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authService.signInWithEmail(email, password);

    if (!result.ok) {
      return result;
    }

    await clearUnownedPendingOnboardingForExistingSignIn();
    await clearPendingSignupVerification();
    setIsPasswordRecovery(false);
    setSession(result.value);
    setStatus('authenticated');
    const profileSync = await syncPendingProfileAfterAuth();
    const lifestyleSync = await persistPendingInitialLifestyleAfterAuth(result.value.user.id);
    if (profileSync.ok && lifestyleSync.ok) {
      await clearCompletedOnboardingLocalData(result.value.user.id);
    }
    return { ok: true as const };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authService.signUpWithEmail(email, password);

    if (!result.ok) {
      await emitSignupForensics({
        stage: 'service-result',
        signupProviderResult: result.error.cause
          ? 'provider_error'
          : result.error.code === 'VALIDATION'
            ? 'local_validation_failed'
            : 'local_failure',
        providerError: result.error.cause,
        outcome: 'failed',
        pendingBindResult: 'not_attempted',
        persistenceResult: 'not_attempted',
      });
      return result;
    }

    await emitSignupForensics({
      stage: 'service-result',
      signupProviderResult:
        result.value.kind === 'authenticated'
          ? 'success_user_and_session'
          : 'success_user_without_session',
      outcome: result.value.kind,
      pendingBindResult: 'not_attempted',
      persistenceResult: 'not_attempted',
      viewerUserId:
        result.value.kind === 'authenticated'
          ? result.value.session.user.id
          : result.value.ownerId,
    });

    if (result.value.kind === 'pending_verification') {
      let pendingBindResult: SignupPendingBindResult = 'not_attempted';
      let failedStage: SignupForensicsStage = 'pending-bind';
      try {
        const ownership = await bindPendingOnboardingToUser(result.value.ownerId);
        pendingBindResult = ownership.ok
          ? ownership.bound
            ? 'bound'
            : 'no_change'
          : 'ownership_mismatch';
        await emitSignupForensics({
          stage: 'pending-bind',
          signupProviderResult: 'success_user_without_session',
          outcome: 'pending_verification',
          pendingBindResult,
          persistenceResult: 'not_attempted',
          viewerUserId: result.value.ownerId,
        });
        if (!ownership.ok) {
          await clearUnownedPendingOnboardingForExistingSignIn();
        }
        failedStage = 'verification-record';
        await savePendingSignupVerification({
          email: result.value.email,
          ownerId: result.value.ownerId,
        });
        await emitSignupForensics({
          stage: 'verification-record',
          signupProviderResult: 'success_user_without_session',
          outcome: 'pending_verification',
          pendingBindResult,
          persistenceResult: 'not_attempted',
          viewerUserId: result.value.ownerId,
        });
      } catch {
        await emitSignupForensics({
          stage: failedStage,
          signupProviderResult: 'success_user_without_session',
          outcome: 'failed',
          pendingBindResult:
            failedStage === 'pending-bind' ? 'threw' : pendingBindResult,
          persistenceResult: 'not_attempted',
          viewerUserId: result.value.ownerId,
        });
        return {
          ok: false as const,
          error: { code: 'UNKNOWN' as const, message: authMessages.generic },
        };
      }
      return { ok: true as const, outcome: result.value };
    }

    let pendingBindResult: SignupPendingBindResult = 'not_attempted';
    try {
      const ownership = await bindPendingOnboardingToUser(result.value.session.user.id);
      pendingBindResult = ownership.ok
        ? ownership.bound
          ? 'bound'
          : 'no_change'
        : 'ownership_mismatch';
      await emitSignupForensics({
        stage: 'pending-bind',
        signupProviderResult: 'success_user_and_session',
        outcome: 'authenticated',
        pendingBindResult,
        persistenceResult: 'not_attempted',
        viewerUserId: result.value.session.user.id,
      });
      if (!ownership.ok) {
        await clearUnownedPendingOnboardingForExistingSignIn();
      }
    } catch {
      await emitSignupForensics({
        stage: 'pending-bind',
        signupProviderResult: 'success_user_and_session',
        outcome: 'failed',
        pendingBindResult: 'threw',
        persistenceResult: 'not_attempted',
        viewerUserId: result.value.session.user.id,
      });
      return {
        ok: false as const,
        error: { code: 'UNKNOWN' as const, message: authMessages.generic },
      };
    }
    setSession(result.value.session);
    setStatus('authenticated');
    setIsPasswordRecovery(false);
    const profileSync = await syncPendingProfileAfterAuth();
    await emitSignupForensics({
      stage: 'profile-persistence',
      signupProviderResult: 'success_user_and_session',
      outcome: 'authenticated',
      pendingBindResult,
      persistenceResult: profileSync.ok ? 'succeeded' : 'failed',
      viewerUserId: result.value.session.user.id,
    });
    const lifestyleSync = await persistPendingInitialLifestyleAfterAuth(result.value.session.user.id);
    await emitSignupForensics({
      stage: 'lifestyle-persistence',
      signupProviderResult: 'success_user_and_session',
      outcome: 'authenticated',
      pendingBindResult,
      persistenceResult: lifestyleSync.ok ? 'succeeded' : 'failed',
      viewerUserId: result.value.session.user.id,
    });
    if (profileSync.ok && lifestyleSync.ok) {
      await clearCompletedOnboardingLocalData(result.value.session.user.id);
    }
    await emitSignupForensics({
      stage: 'complete',
      signupProviderResult: 'success_user_and_session',
      outcome: 'authenticated',
      pendingBindResult,
      persistenceResult:
        profileSync.ok && lifestyleSync.ok ? 'succeeded' : 'failed',
      viewerUserId: result.value.session.user.id,
    });
    return { ok: true as const, outcome: result.value };
  }, []);

  const resendSignupVerification = useCallback(async (email: string) => {
    const result = await authService.resendSignupVerification(email);

    if (!result.ok) {
      return result;
    }

    return { ok: true as const };
  }, []);

  const requestPasswordRecovery = useCallback(async (email: string) => {
    const result = await authService.requestPasswordRecovery(email);
    return result.ok ? { ok: true as const } : result;
  }, []);

  const activatePasswordRecovery = useCallback((recoverySession: AuthSession) => {
    setSession(recoverySession);
    setStatus('authenticated');
    setIsPasswordRecovery(true);
    setIsReady(true);
  }, []);

  const updateRecoveredPassword = useCallback(
    async (password: string, confirmation: string) => {
      if (!isPasswordRecovery || !session) {
        return {
          ok: false as const,
          error: {
            code: 'UNAUTHORIZED' as const,
            message: authMessages.recoverySessionRequired,
          },
        };
      }

      const result = await authService.updatePassword(password, confirmation);
      if (!result.ok) {
        return result;
      }

      setIsPasswordRecovery(false);
      return { ok: true as const };
    },
    [isPasswordRecovery, session],
  );

  const signOut = useCallback(async () => {
    const userId = session?.user.id;
    const result = await authService.signOut();

    if (!result.ok) {
      return result;
    }

    if (userId) {
      await clearCurrentUserPendingOnboardingLeftover(userId);
      await emitOnboardingForensics({
        event: 'logout-clear',
        authenticated: false,
        viewerUserId: null,
        profileWriteResult: 'not_attempted',
        lifestyleWriteResult: 'not_attempted',
        visitIdPresent: false,
      });
    }

    setSession(null);
    setStatus('unauthenticated');
    setIsPasswordRecovery(false);
    return { ok: true as const };
  }, [session?.user.id]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isReady,
      isConfigured,
      isPasswordRecovery,
      signInWithEmail,
      signUpWithEmail,
      resendSignupVerification,
      requestPasswordRecovery,
      activatePasswordRecovery,
      updateRecoveredPassword,
      signOut,
    }),
    [
      status,
      session,
      isReady,
      isConfigured,
      isPasswordRecovery,
      signInWithEmail,
      signUpWithEmail,
      resendSignupVerification,
      requestPasswordRecovery,
      activatePasswordRecovery,
      updateRecoveredPassword,
      signOut,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
