import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';

import type { UserProfile } from '@/lib/domain/profile';
import { emitOnboardingForensics } from '@/lib/onboarding/onboarding-forensics-emit';
import {
  healthScoreInputReadyFromPending,
  resolveOnboardingResultState,
  unavailableReasonFromResult,
} from '@/lib/onboarding/onboarding-result.service';
import type { OnboardingResultState } from '@/lib/onboarding/onboarding-result.types';
import { getVisiblePendingProfileMeasurements } from '@/lib/onboarding/pending-profile-storage';
import { getLocalCalendarDate } from '@/lib/services/health-score';
import { useAuth } from '@/providers/auth-provider';

type UseOnboardingResultOptions = {
  profile: UserProfile | null;
  visit?: string;
};

export function useOnboardingResult({
  profile,
  visit,
}: UseOnboardingResultOptions): OnboardingResultState {
  const { status, session } = useAuth();
  const authenticated = status === 'authenticated';
  const userId = authenticated ? session?.user.id ?? null : null;
  const profileFallback = userId ? profile : null;
  const [state, setState] = useState<OnboardingResultState>({ status: 'loading' });

  useFocusEffect(
    useCallback(() => {
      const requestId = { current: true };
      const asOfDate = getLocalCalendarDate();
      const visitIdPresent = Boolean(visit);

      void (async () => {
        setState({ status: 'loading' });

        await emitOnboardingForensics({
          event: 'step-5-mount',
          authenticated,
          viewerUserId: userId,
          profileWriteResult: 'not_attempted',
          lifestyleWriteResult: 'not_attempted',
          visitIdPresent,
          onboardingResultStatus: 'loading',
          unavailableReason: null,
          healthScoreInputReady: null,
        });

        if (!requestId.current) {
          return;
        }

        const pending = await getVisiblePendingProfileMeasurements(userId);

        if (!requestId.current) {
          return;
        }

        const next = resolveOnboardingResultState(pending, profileFallback, asOfDate);
        await emitOnboardingForensics({
          event: 'step-5-load-complete',
          authenticated,
          viewerUserId: userId,
          profileWriteResult: 'not_attempted',
          lifestyleWriteResult: 'not_attempted',
          visitIdPresent,
          onboardingResultStatus: next.status,
          unavailableReason: unavailableReasonFromResult(next) ?? null,
          healthScoreInputReady: healthScoreInputReadyFromPending(pending, asOfDate),
        });
        setState(next);
      })();

      return () => {
        requestId.current = false;
      };
    }, [authenticated, profileFallback, userId, visit]),
  );

  return state;
}
