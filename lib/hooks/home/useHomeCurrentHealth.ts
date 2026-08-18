import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import type { HealthSnapshot } from '@/lib/domain/snapshot';
import { t } from '@/lib/i18n';
import {
  buildHomeCurrentHealthState,
  type HomeCurrentHealthState,
} from '@/lib/services/home';
import { snapshotService } from '@/lib/services/snapshots';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { useAuth } from '@/providers/auth-provider';

type UseHomeCurrentHealthResult = {
  state: HomeCurrentHealthState;
  snapshotRefreshKey: string;
  isProfileLoading: boolean;
  profile: ReturnType<typeof useCurrentProfile>['profile'];
  latestSnapshot: HealthSnapshot | null;
};

export function useHomeCurrentHealth(): UseHomeCurrentHealthResult {
  const { session, isReady } = useAuth();
  const { profile, isLoading: isProfileLoading, refresh: refreshProfile } = useCurrentProfile();
  const [latestSnapshot, setLatestSnapshot] = useState<HealthSnapshot | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [isSnapshotLoading, setIsSnapshotLoading] = useState(true);
  const isInitialLoadRef = useRef(true);

  const sessionUserId = session?.user.id ?? null;

  const fetchLatestSnapshot = useCallback(
    async (options?: { showLoading?: boolean; cancelled?: () => boolean }) => {
      if (!isReady) {
        return;
      }

      const userId = sessionUserId;
      if (!userId) {
        if (options?.cancelled?.()) {
          return;
        }
        setLatestSnapshot(null);
        setSnapshotError(null);
        setIsSnapshotLoading(false);
        return;
      }

      const showLoading = options?.showLoading ?? isInitialLoadRef.current;
      if (showLoading) {
        if (options?.cancelled?.()) {
          return;
        }
        setIsSnapshotLoading(true);
      }

      const result = await snapshotService.getLatestSnapshot(userId);

      if (options?.cancelled?.()) {
        return;
      }

      if (!result.ok) {
        setSnapshotError(t('home.snapshot.loadError'));
        setIsSnapshotLoading(false);
        return;
      }

      setLatestSnapshot(result.value);
      setSnapshotError(null);
      setIsSnapshotLoading(false);
    },
    [isReady, sessionUserId],
  );

  const fetchLatestSnapshotRef = useRef(fetchLatestSnapshot);
  fetchLatestSnapshotRef.current = fetchLatestSnapshot;

  const refreshProfileRef = useRef(refreshProfile);
  refreshProfileRef.current = refreshProfile;

  useEffect(() => {
    let cancelled = false;

    void fetchLatestSnapshot({
      showLoading: true,
      cancelled: () => cancelled,
    });

    return () => {
      cancelled = true;
    };
  }, [fetchLatestSnapshot]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void refreshProfileRef.current();
      void fetchLatestSnapshotRef.current({
        showLoading: false,
        cancelled: () => cancelled,
      });

      return () => {
        cancelled = true;
      };
    }, []),
  );

  useEffect(() => {
    if (!isSnapshotLoading) {
      isInitialLoadRef.current = false;
    }
  }, [isSnapshotLoading]);

  const state = useMemo((): HomeCurrentHealthState => {
    if (snapshotError) {
      return { status: 'error', message: snapshotError };
    }

    if (isInitialLoadRef.current && isSnapshotLoading) {
      return { status: 'loading' };
    }

    return buildHomeCurrentHealthState(profile, latestSnapshot);
  }, [isSnapshotLoading, latestSnapshot, profile, snapshotError]);

  const snapshotRefreshKey = latestSnapshot?.id ?? 'none';

  return {
    state,
    snapshotRefreshKey,
    isProfileLoading,
    profile,
    latestSnapshot,
  };
}
