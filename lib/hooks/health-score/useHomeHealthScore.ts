import { useMemo } from 'react';

import type { UserProfile } from '@/lib/domain/profile';
import {
  buildHomeHealthScoreState,
  getLocalCalendarDate,
  type HomeHealthScoreState,
} from '@/lib/services/health-score';

type UseHomeHealthScoreOptions = {
  profile: UserProfile | null;
  isProfileLoading: boolean;
};

export function useHomeHealthScore({
  profile,
  isProfileLoading,
}: UseHomeHealthScoreOptions): HomeHealthScoreState {
  const asOfDate = useMemo(() => getLocalCalendarDate(), []);

  return useMemo(
    () => buildHomeHealthScoreState(profile, isProfileLoading, asOfDate),
    [asOfDate, isProfileLoading, profile],
  );
}
