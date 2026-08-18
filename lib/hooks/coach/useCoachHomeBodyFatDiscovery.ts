import { useCallback, useEffect, useState } from 'react';

import {
  getCoachHomeBodyFatComparisonUsed,
  markCoachHomeBodyFatComparisonUsed,
} from '@/lib/presentation/coach-home/coach-home-body-fat-discovery.storage';
import { useAuth } from '@/providers/auth-provider';

type UseCoachHomeBodyFatDiscoveryResult = {
  bodyFatComparisonUsed: boolean;
  markBodyFatComparisonUsed: () => void;
};

/**
 * Per-authenticated-user local flag for the body-fat discovery chip.
 * Read failures keep the default unused state so Coach Home still renders.
 */
export function useCoachHomeBodyFatDiscovery(): UseCoachHomeBodyFatDiscoveryResult {
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [bodyFatComparisonUsed, setBodyFatComparisonUsed] = useState(false);

  useEffect(() => {
    setBodyFatComparisonUsed(false);
    if (!userId) {
      return;
    }

    let cancelled = false;
    void getCoachHomeBodyFatComparisonUsed(userId).then((used) => {
      if (!cancelled) {
        setBodyFatComparisonUsed(used);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const markBodyFatComparisonUsed = useCallback(() => {
    setBodyFatComparisonUsed(true);
    if (!userId) {
      return;
    }
    void markCoachHomeBodyFatComparisonUsed(userId);
  }, [userId]);

  return {
    bodyFatComparisonUsed,
    markBodyFatComparisonUsed,
  };
}
