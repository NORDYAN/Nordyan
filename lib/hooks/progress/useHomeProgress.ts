import { useEffect, useState } from 'react';

import type { UserProfile } from '@/lib/domain/profile';
import { getHomeProgressUnavailableMessage, type HomeProgressFetchState } from '@/lib/presentation/home';
import { progressService } from '@/lib/services/progress';

type UseHomeProgressOptions = {
  profile: UserProfile | null;
  isProfileLoading: boolean;
  snapshotRefreshKey?: string;
};

export function useHomeProgress({
  profile,
  isProfileLoading,
  snapshotRefreshKey = 'none',
}: UseHomeProgressOptions): HomeProgressFetchState {
  const [state, setState] = useState<HomeProgressFetchState>({ status: 'loading' });

  useEffect(() => {
    const userId = profile?.userId;

    if (!userId) {
      if (isProfileLoading) {
        setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));
        return;
      }

      setState({
        status: 'unavailable',
        message: getHomeProgressUnavailableMessage(),
      });
      return;
    }

    let cancelled = false;

    setState((current) => (current.status === 'loaded' ? current : { status: 'loading' }));

    void progressService.getProgressSummary(userId).then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        const message = result.error.message ?? '';
        const isMissingSnapshotsTable =
          message.includes('health_snapshots') ||
          message.includes('schema cache') ||
          message.includes('PGRST205');

        if (isMissingSnapshotsTable) {
          setState({
            status: 'loaded',
            summary: { trend: 'insufficient_history' },
          });
          return;
        }

        setState({
          status: 'unavailable',
          message: getHomeProgressUnavailableMessage(),
        });
        return;
      }

      setState({ status: 'loaded', summary: result.value });
    });

    return () => {
      cancelled = true;
    };
  }, [isProfileLoading, profile?.userId, snapshotRefreshKey]);

  return state;
}
