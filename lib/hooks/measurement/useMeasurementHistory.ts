import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { Measurement } from '@/lib/domain/measurement';
import { t } from '@/lib/i18n';
import { measurementService } from '@/lib/services/measurement';
import { useAuth } from '@/providers/auth-provider';

export type MeasurementHistoryState =
  | { status: 'loading' }
  | { status: 'empty' }
  | { status: 'ready'; measurements: Measurement[] }
  | { status: 'error'; message: string };

type UseMeasurementHistoryResult = {
  state: MeasurementHistoryState;
  refresh: () => Promise<void>;
};

export function useMeasurementHistory(): UseMeasurementHistoryResult {
  const { session, isReady } = useAuth();
  const [state, setState] = useState<MeasurementHistoryState>({ status: 'loading' });
  const isInitialLoadRef = useRef(true);

  const sessionUserId = session?.user.id ?? null;

  const fetchHistory = useCallback(
    async (options?: { showLoading?: boolean; cancelled?: () => boolean }) => {
      if (!isReady) {
        return;
      }

      const userId = sessionUserId;
      if (!userId) {
        if (options?.cancelled?.()) {
          return;
        }

        setState({ status: 'empty' });
        return;
      }

      const showLoading = options?.showLoading ?? isInitialLoadRef.current;
      if (showLoading) {
        if (options?.cancelled?.()) {
          return;
        }

        setState({ status: 'loading' });
      }

      const result = await measurementService.getMeasurementHistory(userId);

      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setState({
          status: 'error',
          message: t('health.history.loadError'),
        });
        return;
      }

      if (result.value.length === 0) {
        setState({ status: 'empty' });
        return;
      }

      setState({ status: 'ready', measurements: result.value });
    },
    [isReady, sessionUserId],
  );

  const fetchHistoryRef = useRef(fetchHistory);
  fetchHistoryRef.current = fetchHistory;

  useEffect(() => {
    let cancelled = false;

    void fetchHistory({
      showLoading: true,
      cancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchHistory]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void fetchHistoryRef.current({
        showLoading: false,
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
    await fetchHistoryRef.current({ showLoading: true });
  }, []);

  return { state, refresh };
}
