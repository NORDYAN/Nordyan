import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  toHomeWeeklyFocusStatus,
  type HomeWeeklyFocusStatus,
} from '@/lib/presentation/home';
import { weeklyFocusService, type DefaultWeeklyFocusService } from '@/lib/services/weekly-focus';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { useAuth } from '@/providers/auth-provider';

type UseHomeWeeklyFocusOptions = {
  weeklyFocus?: Pick<DefaultWeeklyFocusService, 'getOrCreateCurrent'>;
  localDate?: string;
};

export type UseHomeWeeklyFocusResult = {
  state: HomeWeeklyFocusStatus;
};

export function useHomeWeeklyFocus(options?: UseHomeWeeklyFocusOptions): UseHomeWeeklyFocusResult {
  const weeklyFocus = options?.weeklyFocus ?? weeklyFocusService;
  const { session, isReady } = useAuth();
  const { profile, isLoading: isProfileLoading } = useCurrentProfile();
  const [state, setState] = useState<HomeWeeklyFocusStatus>({ status: 'loading' });
  const sessionUserId = session?.user.id ?? null;

  const loadStatus = useCallback(
    async (loadOptions?: { cancelled?: () => boolean; showLoading?: boolean }) => {
      if (!isReady) {
        return;
      }

      if (!sessionUserId) {
        if (loadOptions?.cancelled?.()) {
          return;
        }
        setState({ status: 'unavailable' });
        return;
      }

      if (loadOptions?.showLoading) {
        setState({ status: 'loading' });
      }

      const result = await weeklyFocus.getOrCreateCurrent({
        userId: sessionUserId,
        localDate: options?.localDate,
        profile: isProfileLoading
          ? { status: 'loading' }
          : { status: 'ready', activityLevel: profile?.activityLevel ?? null },
      });

      if (loadOptions?.cancelled?.()) {
        return;
      }

      setState(toHomeWeeklyFocusStatus(result));
    },
    [isProfileLoading, isReady, options?.localDate, profile?.activityLevel, sessionUserId, weeklyFocus],
  );

  const loadStatusRef = useRef(loadStatus);
  loadStatusRef.current = loadStatus;

  useEffect(() => {
    let cancelled = false;
    void loadStatus({ showLoading: true, cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [loadStatus]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadStatusRef.current({ showLoading: false, cancelled: () => cancelled });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void loadStatusRef.current({ showLoading: false });
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  return { state };
}
