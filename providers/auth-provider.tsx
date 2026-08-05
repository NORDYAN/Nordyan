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
import type { AuthSession, AuthStatus } from '@/lib/domain/auth';
import { syncPendingProfileAfterAuth } from '@/lib/onboarding/sync-pending-profile';
import { authService } from '@/lib/services/auth/auth.service';
import { getSupabaseClient } from '@/lib/supabase/client';

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  isReady: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ ok: true } | { ok: false; error: AppError }>;
  signOut: () => Promise<{ ok: true } | { ok: false; error: AppError }>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const isConfigured = isSupabaseConfigured();
  const [status, setStatus] = useState<AuthStatus>('unknown');
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isReady, setIsReady] = useState(false);

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
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
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
      } else {
        setSession(null);
        setStatus('unauthenticated');
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

    setSession(result.value);
    setStatus('authenticated');
    await syncPendingProfileAfterAuth();
    return { ok: true as const };
  }, []);

  const signUpWithEmail = useCallback(async (email: string, password: string) => {
    const result = await authService.signUpWithEmail(email, password);

    if (!result.ok) {
      return result;
    }

    setSession(result.value);
    setStatus('authenticated');
    await syncPendingProfileAfterAuth();
    return { ok: true as const };
  }, []);

  const signOut = useCallback(async () => {
    const result = await authService.signOut();

    if (!result.ok) {
      return result;
    }

    setSession(null);
    setStatus('unauthenticated');
    return { ok: true as const };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      session,
      isReady,
      isConfigured,
      signInWithEmail,
      signUpWithEmail,
      signOut,
    }),
    [status, session, isReady, isConfigured, signInWithEmail, signUpWithEmail, signOut],
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
