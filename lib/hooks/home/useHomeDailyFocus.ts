import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import {
  applyHomeDailyFocusGetResult,
  applyHomeDailyFocusMutationResult,
  canMutateHomeDailyFocus,
  canSwapHomeDailyFocus,
  createInitialHomeDailyFocusModel,
  isHomeDailyFocusCompleted,
  startHomeDailyFocusMutation,
  toDailyFocusWeeklyFocusInput,
  type HomeDailyFocusModel,
} from '@/lib/presentation/home/home-daily-focus.presentation';
import type { HomeWeeklyFocusStatus } from '@/lib/presentation/home';
import { dailyFocusService, type DefaultDailyFocusService } from '@/lib/services/daily-focus';
import { useAuth } from '@/providers/auth-provider';

type DailyFocusClient = Pick<
  DefaultDailyFocusService,
  'getOrCreateCurrent' | 'swapCurrent' | 'markCompleteCurrent' | 'undoCompleteCurrent'
>;

type UseHomeDailyFocusOptions = {
  weeklyFocus: HomeWeeklyFocusStatus;
  dailyFocus?: DailyFocusClient;
};

export type UseHomeDailyFocusResult = {
  model: HomeDailyFocusModel;
  complete: () => Promise<void>;
  undo: () => Promise<void>;
  swap: () => Promise<void>;
  refetch: () => Promise<void>;
};

export function useHomeDailyFocus(options: UseHomeDailyFocusOptions): UseHomeDailyFocusResult {
  const dailyFocus = options.dailyFocus ?? dailyFocusService;
  const weeklyFocus = options.weeklyFocus;
  const { session, isReady } = useAuth();
  const [model, setModel] = useState<HomeDailyFocusModel>(createInitialHomeDailyFocusModel);
  const sessionUserId = session?.user.id ?? null;
  const mutatingRef = useRef(false);
  const requestIdRef = useRef(0);
  const modelRef = useRef(model);
  modelRef.current = model;

  const loadCurrent = useCallback(
    async (loadOptions?: { cancelled?: () => boolean; showLoading?: boolean }) => {
      if (!isReady) {
        return;
      }

      const weeklyInput = toDailyFocusWeeklyFocusInput(weeklyFocus);
      if (weeklyInput == null) {
        if (loadOptions?.cancelled?.()) {
          return;
        }
        setModel((current) => ({
          ...current,
          loadStatus: 'loading',
          mutating: false,
        }));
        return;
      }

      if (weeklyInput.status !== 'ready') {
        if (loadOptions?.cancelled?.()) {
          return;
        }
        setModel((current) => ({
          ...current,
          loadStatus: 'unavailable',
          mutating: false,
        }));
        return;
      }

      if (!sessionUserId) {
        if (loadOptions?.cancelled?.()) {
          return;
        }
        setModel((current) => ({
          ...current,
          loadStatus: 'unavailable',
          mutating: false,
        }));
        return;
      }

      if (mutatingRef.current) {
        return;
      }

      if (loadOptions?.showLoading) {
        setModel((current) => ({
          ...current,
          loadStatus: 'loading',
          mutating: false,
        }));
      }

      const requestId = ++requestIdRef.current;
      const result = await dailyFocus.getOrCreateCurrent({
        userId: sessionUserId,
        weeklyFocus: weeklyInput,
      });

      if (loadOptions?.cancelled?.() || requestId !== requestIdRef.current || mutatingRef.current) {
        return;
      }

      setModel((current) => applyHomeDailyFocusGetResult(current, result));
    },
    [dailyFocus, isReady, sessionUserId, weeklyFocus],
  );

  const loadCurrentRef = useRef(loadCurrent);
  loadCurrentRef.current = loadCurrent;

  useEffect(() => {
    let cancelled = false;
    void loadCurrent({
      showLoading: weeklyFocus.status === 'loading',
      cancelled: () => cancelled,
    });
    return () => {
      cancelled = true;
    };
  }, [loadCurrent, weeklyFocus.status]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void loadCurrentRef.current({ showLoading: false, cancelled: () => cancelled });
      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') {
        void loadCurrentRef.current({ showLoading: false });
      }
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => {
      subscription.remove();
    };
  }, []);

  const runMutation = useCallback(
    async (
      allowed: (current: HomeDailyFocusModel) => boolean,
      mutate: DailyFocusClient['markCompleteCurrent'],
    ) => {
      const current = modelRef.current;
      if (!sessionUserId || mutatingRef.current || !allowed(current)) {
        return;
      }

      mutatingRef.current = true;
      setModel(startHomeDailyFocusMutation(current));
      const result = await mutate({ userId: sessionUserId });
      mutatingRef.current = false;
      setModel((next) => applyHomeDailyFocusMutationResult(next, result));
    },
    [sessionUserId],
  );

  const complete = useCallback(async () => {
    await runMutation(
      (current) => canMutateHomeDailyFocus(current) && !isHomeDailyFocusCompleted(current.assignment),
      (input) => dailyFocus.markCompleteCurrent(input),
    );
  }, [dailyFocus, runMutation]);

  const undo = useCallback(async () => {
    await runMutation(
      (current) => canMutateHomeDailyFocus(current) && isHomeDailyFocusCompleted(current.assignment),
      (input) => dailyFocus.undoCompleteCurrent(input),
    );
  }, [dailyFocus, runMutation]);

  const swap = useCallback(async () => {
    await runMutation(canSwapHomeDailyFocus, (input) => dailyFocus.swapCurrent(input));
  }, [dailyFocus, runMutation]);

  const refetch = useCallback(async () => {
    await loadCurrent({ showLoading: false });
  }, [loadCurrent]);

  return {
    model,
    complete,
    undo,
    swap,
    refetch,
  };
}
