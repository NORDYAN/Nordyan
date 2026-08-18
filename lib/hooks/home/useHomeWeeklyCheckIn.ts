import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import {
  resolveHomeWeeklyCheckInStatus,
  type HomeWeeklyCheckInStatus,
} from '@/lib/presentation/home';
import { initialLifestyleService, type InitialLifestyleService } from '@/lib/services/initial-lifestyle';
import { weeklyCheckInService, type WeeklyCheckInService } from '@/lib/services/weekly-check-in';
import { useAuth } from '@/providers/auth-provider';

type UseHomeWeeklyCheckInOptions = {
  weeklyCheckIn?: Pick<WeeklyCheckInService, 'getCurrentWeek'>;
  initialLifestyle?: Pick<InitialLifestyleService, 'get'>;
};

export type UseHomeWeeklyCheckInResult = {
  state: HomeWeeklyCheckInStatus;
};

export function useHomeWeeklyCheckIn(
  options?: UseHomeWeeklyCheckInOptions,
): UseHomeWeeklyCheckInResult {
  const weeklyCheckIn = options?.weeklyCheckIn ?? weeklyCheckInService;
  const initialLifestyle = options?.initialLifestyle ?? initialLifestyleService;
  const { session, isReady } = useAuth();
  const [state, setState] = useState<HomeWeeklyCheckInStatus>({ status: 'loading' });
  const sessionUserId = session?.user.id ?? null;

  const loadStatus = useCallback(
    async (loadOptions?: { cancelled?: () => boolean; showLoading?: boolean }) => {
      if (!isReady) {
        return;
      }

      if (loadOptions?.showLoading) {
        setState({ status: 'loading' });
      }

      const next = await resolveHomeWeeklyCheckInStatus({
        weeklyCheckIn,
        initialLifestyle,
        userId: sessionUserId,
      });
      if (loadOptions?.cancelled?.()) {
        return;
      }

      setState(next);
    },
    [initialLifestyle, isReady, sessionUserId, weeklyCheckIn],
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

  return { state };
}
