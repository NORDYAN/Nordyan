import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import { isProfileComplete, type UserProfile } from '@/lib/domain/profile';
import {
  buildOnboardingResultFromMeasurements,
  buildOnboardingResultFromProfile,
} from '@/lib/onboarding/onboarding-result.service';
import type { OnboardingResultState } from '@/lib/onboarding/onboarding-result.types';
import { getPendingProfileMeasurements } from '@/lib/onboarding/pending-profile-storage';
import { getLocalCalendarDate } from '@/lib/services/health-score';

type UseOnboardingResultOptions = {
  profile: UserProfile | null;
};

export function useOnboardingResult({ profile }: UseOnboardingResultOptions): OnboardingResultState {
  const [state, setState] = useState<OnboardingResultState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const asOfDate = getLocalCalendarDate();

      void (async () => {
        setState({ status: 'loading' });

        const pending = await getPendingProfileMeasurements();
        if (cancelled) {
          return;
        }

        if (pending) {
          setState(buildOnboardingResultFromMeasurements(pending, asOfDate));
          return;
        }

        if (profile && isProfileComplete(profile)) {
          setState(buildOnboardingResultFromProfile(profile, asOfDate));
          return;
        }

        setState({ status: 'unavailable' });
      })();

      return () => {
        cancelled = true;
      };
    }, [profile]),
  );

  return state;
}
