import { useCallback, useEffect, useRef, useState } from 'react';

import type { HealthScoreExplainedFetchState } from '@/lib/presentation/health-score-explained';
import {
  getHealthScoreExplainedEmptyMessage,
  getHealthScoreExplainedErrorMessage,
  mapHealthScoreExplainedSummaryToFetchState,
} from '@/lib/presentation/health-score-explained';
import { healthScoreExplainedService } from '@/lib/services/health-score-explained';
import { useAuth } from '@/providers/auth-provider';

type UseHealthScoreExplainedResult = {
  state: HealthScoreExplainedFetchState;
  refresh: () => Promise<void>;
};

export function useHealthScoreExplained(): UseHealthScoreExplainedResult {
  const { session, isReady } = useAuth();
  const [state, setState] = useState<HealthScoreExplainedFetchState>({ status: 'loading' });
  const isInitialLoadRef = useRef(true);

  const sessionUserId = session?.user.id ?? null;

  const fetchExplained = useCallback(
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
          message: getHealthScoreExplainedEmptyMessage(),
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

      const result = await healthScoreExplainedService.getExplainedSummary(userId);

      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setState({
          status: 'error',
          message: getHealthScoreExplainedErrorMessage(),
        });
        return;
      }

      setState(mapHealthScoreExplainedSummaryToFetchState(result.value));
    },
    [isReady, sessionUserId],
  );

  const fetchExplainedRef = useRef(fetchExplained);
  fetchExplainedRef.current = fetchExplained;

  useEffect(() => {
    let cancelled = false;

    void fetchExplained({
      showLoading: true,
      cancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchExplained]);

  useEffect(() => {
    if (state.status !== 'loading') {
      isInitialLoadRef.current = false;
    }
  }, [state.status]);

  const refresh = useCallback(async () => {
    await fetchExplainedRef.current({ showLoading: true });
  }, []);

  return { state, refresh };
}
