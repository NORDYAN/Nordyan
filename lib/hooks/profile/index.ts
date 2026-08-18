import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { AppError } from '@/lib/core';
import type { UserProfile } from '@/lib/domain/profile';
import { profileService } from '@/lib/services/profile';
import { useAuth } from '@/providers/auth-provider';

type RefreshOptions = {
  showLoading?: boolean;
};

type UseCurrentProfileResult = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: AppError | null;
  refresh: (options?: RefreshOptions) => Promise<void>;
};

/**
 * Per-screen profile read. `refresh()` is the invalidation API.
 * Screens also refetch on focus with `showLoading: false` so returning from
 * Konto & profil updates the Profile card without a loading flash.
 */
export function useCurrentProfile(): UseCurrentProfileResult {
  const { status, session, isReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const refresh = useCallback(
    async (options?: RefreshOptions) => {
      if (!isReady || status !== 'authenticated' || !session) {
        setProfile(null);
        setError(null);
        setIsLoading(false);
        return;
      }

      if (options?.showLoading ?? true) {
        setIsLoading(true);
      }

      const result = await profileService.getCurrentProfile();

      if (!result.ok) {
        setProfile(null);
        setError(result.error);
        setIsLoading(false);
        return;
      }

      setProfile(result.value);
      setError(null);
      setIsLoading(false);
    },
    [isReady, session, status],
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    let cancelled = false;
    void refresh().then(() => {
      if (cancelled) {
        return;
      }
    });
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void refreshRef.current({ showLoading: false }).then(() => {
        if (cancelled) {
          return;
        }
      });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  return { profile, isLoading, error, refresh };
}
