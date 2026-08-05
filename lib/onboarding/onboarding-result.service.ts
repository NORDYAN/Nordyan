import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';
import { buildHomeCoachState } from '@/lib/services/coach';
import { buildHomePrimaryFocusState } from '@/lib/services/focus';
import {
  calculateHomeHealthScoreFromProfile,
  getLocalCalendarDate,
  type HomeHealthScoreState,
} from '@/lib/services/health-score';

import { draftProfileFromMeasurements } from './onboarding-result.mapper';
import {
  formatOnboardingHealthScore,
} from './onboarding-result.presentation';
import { formatBodyFatPercent } from '@/lib/services/health-score';
import type { OnboardingResultState } from './onboarding-result.types';

export function buildOnboardingResultFromProfile(
  profile: UserProfile,
  asOfDate: string = getLocalCalendarDate(),
): OnboardingResultState {
  const calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate);
  if (!calculated) {
    return { status: 'unavailable' };
  }

  const healthScoreState: HomeHealthScoreState = {
    status: 'ready',
    score: calculated.score,
    subtitle: calculated.subtitle,
    input: calculated.input,
    result: calculated.result,
  };

  const focusState = buildHomePrimaryFocusState(healthScoreState);
  const coachState = buildHomeCoachState(profile, healthScoreState, focusState);

  if (coachState.status !== 'ready') {
    return { status: 'unavailable' };
  }

  return {
    status: 'ready',
    bodyFatPercentLabel: formatBodyFatPercent(calculated.result.metrics.bodyFatPct),
    healthScoreLabel: formatOnboardingHealthScore(calculated.score),
    coachTitle: coachState.title,
    coachMessage: coachState.message,
  };
}

export function buildOnboardingResultFromMeasurements(
  measurements: ProfileMeasurements,
  asOfDate: string = getLocalCalendarDate(),
): OnboardingResultState {
  const draftProfile = draftProfileFromMeasurements(measurements);
  if (!draftProfile) {
    return { status: 'unavailable' };
  }

  return buildOnboardingResultFromProfile(draftProfile, asOfDate);
}
