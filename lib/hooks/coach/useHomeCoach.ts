import { useMemo } from 'react';

import type { UserProfile } from '@/lib/domain/profile';
import { buildHomeCoachState, type HomeCoachState } from '@/lib/services/coach';
import type { HomeHealthScoreState } from '@/lib/services/health-score';
import type { HomePrimaryFocusState } from '@/lib/services/focus';

type UseHomeCoachOptions = {
  profile: UserProfile | null;
  healthScoreState: HomeHealthScoreState;
  primaryFocusState: HomePrimaryFocusState;
};

export function useHomeCoach({
  profile,
  healthScoreState,
  primaryFocusState,
}: UseHomeCoachOptions): HomeCoachState {
  return useMemo(
    () => buildHomeCoachState(profile, healthScoreState, primaryFocusState),
    [healthScoreState, primaryFocusState, profile],
  );
}
