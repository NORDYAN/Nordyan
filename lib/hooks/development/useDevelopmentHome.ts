import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { DevelopmentHomeFetchState } from '@/lib/presentation/development';
import {
  DEVELOPMENT_FOCUS_REFRESH,
  getDevelopmentHomeEmptyMessage,
  getDevelopmentHomeErrorMessage,
  mapDevelopmentHomeSummaryToFetchState,
} from '@/lib/presentation/development';
import { developmentService } from '@/lib/services/development';
import { useAuth } from '@/providers/auth-provider';

type UseDevelopmentHomeResult = {
  state: DevelopmentHomeFetchState;
  refresh: () => Promise<void>;
};

export function useDevelopmentHome(): UseDevelopmentHomeResult {
  const { session, isReady } = useAuth();
  const [state, setState] = useState<DevelopmentHomeFetchState>({ status: 'loading' });
  const isInitialLoadRef = useRef(true);

  const sessionUserId = session?.user.id ?? null;

  const fetchHome = useCallback(
    async (options?: { showLoading?: boolean; cancelled?: () => boolean }) => {
      if (!isReady) {
        return;
      }

      const userId = sessionUserId;
      if (!userId) {
        if (options?.cancelled?.()) {
          return;
        }

        setState({
          status: 'empty',
          message: getDevelopmentHomeEmptyMessage(),
        });
        return;
      }

      const showLoading = options?.showLoading ?? isInitialLoadRef.current;
      if (showLoading) {
        if (options?.cancelled?.()) {
          return;
        }

        setState((current) =>
          current.status === 'ready' || current.status === 'insufficient_history'
            ? current
            : { status: 'loading' },
        );
      }

      const result = await developmentService.getHomeSummary(userId);

      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setState({
          status: 'error',
          message: getDevelopmentHomeErrorMessage(),
        });
        return;
      }

      setState(mapDevelopmentHomeSummaryToFetchState(result.value));
    },
    [isReady, sessionUserId],
  );

  const fetchHomeRef = useRef(fetchHome);
  fetchHomeRef.current = fetchHome;

  useEffect(() => {
    let cancelled = false;

    void fetchHome({
      showLoading: true,
      cancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchHome]);

  useFocusEffect(
    useCallback(() => {
      if (!DEVELOPMENT_FOCUS_REFRESH.home.refetchOnFocus) {
        return;
      }

      let cancelled = false;

      void fetchHomeRef.current({
        showLoading: DEVELOPMENT_FOCUS_REFRESH.home.showLoading,
        cancelled: () => cancelled,
      });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (state.status !== 'loading') {
      isInitialLoadRef.current = false;
    }
  }, [state.status]);

  const refresh = useCallback(async () => {
    await fetchHomeRef.current({ showLoading: true });
  }, []);

  return { state, refresh };
}
