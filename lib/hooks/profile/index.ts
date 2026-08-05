import { useCallback, useEffect, useState } from 'react';

import type { AppError } from '@/lib/core';
import type { UserProfile } from '@/lib/domain/profile';
import { profileService } from '@/lib/services/profile/profile.service';
import { useAuth } from '@/providers/auth-provider';

type UseCurrentProfileResult = {
  profile: UserProfile | null;
  isLoading: boolean;
  error: AppError | null;
  refresh: () => Promise<void>;
};

export function useCurrentProfile(): UseCurrentProfileResult {
  const { status, session, isReady } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const refresh = useCallback(async () => {
    if (!isReady || status !== 'authenticated' || !session) {
      setProfile(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
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
  }, [isReady, session, status]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { profile, isLoading, error, refresh };
}
