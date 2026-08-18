import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type {
  DevelopmentMetricOption,
  DevelopmentPeriodOption,
  DevelopmentTrendsFetchState,
} from '@/lib/presentation/development';
import {
  DEVELOPMENT_FOCUS_REFRESH,
  DEVELOPMENT_METRIC_OPTIONS,
  DEVELOPMENT_PERIOD_OPTIONS,
  getDevelopmentTrendsErrorMessage,
  mapDevelopmentTrendsSummaryToFetchState,
} from '@/lib/presentation/development';
import {
  developmentService,
  type DevelopmentPeriod,
  type DevelopmentTrendMetric,
  type DevelopmentTrendsSummary,
} from '@/lib/services/development';
import { useAuth } from '@/providers/auth-provider';

type UseDevelopmentTrendsOptions = {
  initialPeriod?: DevelopmentPeriod;
  initialMetric?: DevelopmentTrendMetric;
};

type UseDevelopmentTrendsResult = {
  state: DevelopmentTrendsFetchState;
  period: DevelopmentPeriod;
  metric: DevelopmentTrendMetric;
  setPeriod: (period: DevelopmentPeriod) => void;
  setMetric: (metric: DevelopmentTrendMetric) => void;
  periodOptions: readonly DevelopmentPeriodOption[];
  metricOptions: readonly DevelopmentMetricOption[];
  refresh: () => Promise<void>;
};

export function useDevelopmentTrends(
  options: UseDevelopmentTrendsOptions = {},
): UseDevelopmentTrendsResult {
  const { session, isReady } = useAuth();
  const [period, setPeriod] = useState<DevelopmentPeriod>(options.initialPeriod ?? '30d');
  const [metric, setMetric] = useState<DevelopmentTrendMetric>(
    options.initialMetric ?? 'health_score',
  );
  const [summary, setSummary] = useState<DevelopmentTrendsSummary | null>(null);
  const [fetchStatus, setFetchStatus] = useState<'loading' | 'error' | 'loaded'>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const isInitialLoadRef = useRef(true);

  const sessionUserId = session?.user.id ?? null;

  const fetchTrends = useCallback(
    async (options?: {
      period?: DevelopmentPeriod;
      showLoading?: boolean;
      cancelled?: () => boolean;
    }) => {
      if (!isReady) {
        return;
      }

      const userId = sessionUserId;
      const nextPeriod = options?.period ?? period;

      if (!userId) {
        if (options?.cancelled?.()) {
          return;
        }

        setSummary(null);
        setFetchStatus('loaded');
        setErrorMessage(null);
        return;
      }

      const showLoading = options?.showLoading ?? isInitialLoadRef.current;
      if (showLoading) {
        if (options?.cancelled?.()) {
          return;
        }

        setFetchStatus((current) => (current === 'loaded' ? current : 'loading'));
      }

      const result = await developmentService.getTrendsSummary(userId, nextPeriod);

      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setSummary(null);
        setFetchStatus('error');
        setErrorMessage(getDevelopmentTrendsErrorMessage());
        return;
      }

      setSummary(result.value);
      setFetchStatus('loaded');
      setErrorMessage(null);
    },
    [isReady, period, sessionUserId],
  );

  const fetchTrendsRef = useRef(fetchTrends);
  fetchTrendsRef.current = fetchTrends;
  const periodRef = useRef(period);
  periodRef.current = period;

  useEffect(() => {
    let cancelled = false;

    void fetchTrends({
      period,
      showLoading: true,
      cancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchTrends, period]);

  useFocusEffect(
    useCallback(() => {
      if (!DEVELOPMENT_FOCUS_REFRESH.trends.refetchOnFocus) {
        return;
      }

      let cancelled = false;

      void fetchTrendsRef.current({
        period: DEVELOPMENT_FOCUS_REFRESH.trends.preservePeriod
          ? periodRef.current
          : undefined,
        showLoading: DEVELOPMENT_FOCUS_REFRESH.trends.showLoading,
        cancelled: () => cancelled,
      });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (fetchStatus !== 'loading') {
      isInitialLoadRef.current = false;
    }
  }, [fetchStatus]);

  const state: DevelopmentTrendsFetchState = useMemo(() => {
    if (fetchStatus === 'loading') {
      return { status: 'loading' };
    }

    if (fetchStatus === 'error') {
      return {
        status: 'error',
        message: errorMessage ?? getDevelopmentTrendsErrorMessage(),
      };
    }

    if (!sessionUserId || !summary) {
      return mapDevelopmentTrendsSummaryToFetchState(
        {
          period,
          periodSince: '',
          currentScore: null,
          periodChange: null,
          hasSufficientHistory: false,
          series: {
            healthScore: [],
            weight: [],
            waist: [],
            neck: [],
            activity: [],
          },
          coach: {
            available: false,
            title: null,
            message: null,
            recommendationId: null,
          },
        },
        metric,
      );
    }

    return mapDevelopmentTrendsSummaryToFetchState(summary, metric);
  }, [errorMessage, fetchStatus, metric, period, sessionUserId, summary]);

  const handleSetPeriod = useCallback((next: DevelopmentPeriod) => {
    setPeriod(next);
    setSummary(null);
    setFetchStatus('loading');
    setErrorMessage(null);
  }, []);

  const refresh = useCallback(async () => {
    await fetchTrendsRef.current({ showLoading: true });
  }, []);

  return {
    state,
    period,
    metric,
    setPeriod: handleSetPeriod,
    setMetric,
    periodOptions: DEVELOPMENT_PERIOD_OPTIONS,
    metricOptions: DEVELOPMENT_METRIC_OPTIONS,
    refresh,
  };
}
