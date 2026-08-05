import { useMemo } from 'react';

import { buildHomePrimaryFocusState, type HomePrimaryFocusState } from '@/lib/services/focus';
import type { HomeHealthScoreState } from '@/lib/services/health-score';

export function useHomePrimaryFocus(
  healthScoreState: HomeHealthScoreState,
): HomePrimaryFocusState {
  return useMemo(
    () => buildHomePrimaryFocusState(healthScoreState),
    [healthScoreState],
  );
}
