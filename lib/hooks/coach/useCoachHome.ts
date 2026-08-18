import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useEffect, useRef, useState } from 'react';

import {
  COACH_HOME_FOCUS_REFRESH,
  mapCoachHomeSummaryToFetchState,
  type CoachHomeFetchState,
} from '@/lib/presentation/coach-home';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { coachHomeService } from '@/lib/services/coach-home';
import { useAuth } from '@/providers/auth-provider';

type UseCoachHomeResult = {
  state: CoachHomeFetchState;
  refresh: () => Promise<void>;
};

export function useCoachHome(): UseCoachHomeResult {
  const { session, isReady } = useAuth();
  const { locale } = useI18n();
  const [state, setState] = useState<CoachHomeFetchState>({ status: 'loading' });
  const isInitialLoadRef = useRef(true);
  const requestIdRef = useRef(0);
  const sessionUserId = session?.user.id ?? null;

  const fetchHome = useCallback(
    async (options?: { showLoading?: boolean; cancelled?: () => boolean }) => {
      if (!isReady) {
        return;
      }

      const requestId = ++requestIdRef.current;
      const isCancelled = () =>
        options?.cancelled?.() === true || requestId !== requestIdRef.current;
      const userId = sessionUserId;
      if (!userId) {
        if (isCancelled()) {
          return;
        }
        setState({ status: 'empty', message: t('coach.empty') });
        return;
      }

      const showLoading = options?.showLoading ?? isInitialLoadRef.current;
      if (showLoading) {
        if (isCancelled()) {
          return;
        }
        setState((current) => (current.status === 'ready' ? current : { status: 'loading' }));
      }

      const result = await coachHomeService.getHomeSummary(userId);
      if (isCancelled()) {
        return;
      }

      if (!result.ok) {
        setState((current) =>
          !showLoading && current.status === 'ready'
            ? current
            : {
                status: 'error',
                message: t('coach.error'),
              },
        );
        return;
      }

      setState(mapCoachHomeSummaryToFetchState(result.value));
    },
    [isReady, locale, sessionUserId],
  );

  const fetchHomeRef = useRef(fetchHome);
  fetchHomeRef.current = fetchHome;

  useEffect(() => {
    let cancelled = false;
    void fetchHome({ showLoading: true, cancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [fetchHome]);

  useFocusEffect(
    useCallback(() => {
      if (!COACH_HOME_FOCUS_REFRESH.refetchOnFocus) {
        return;
      }

      let cancelled = false;
      void fetchHomeRef.current({
        showLoading: COACH_HOME_FOCUS_REFRESH.showLoading,
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
