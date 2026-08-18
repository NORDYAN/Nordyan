import { isProfileComplete, type ProfileMeasurements, type UserProfile } from '@/lib/domain/profile';
import { getLocalizedCoachPresentation } from '@/lib/i18n';
import { buildHomeCoachState } from '@/lib/services/coach';
import { formatCoachMessage } from '@/lib/services/coach/coach.presentation';
import { buildHomePrimaryFocusState } from '@/lib/services/focus';
import {
  canPresentBodyFatEstimate,
  calculateHomeHealthScoreFromProfile,
  formatBodyFatPercent,
  getLocalCalendarDate,
  type HomeHealthScoreState,
} from '@/lib/services/health-score';
import { mapProfileToHealthScoreInput } from '@/lib/services/health-score/health-score.mapper';

import type { OnboardingResultUnavailableReason } from './onboarding-forensics';
import { draftProfileFromMeasurements } from './onboarding-result.mapper';
import { formatOnboardingHealthScore } from './onboarding-result.presentation';
import type { OnboardingResultState } from './onboarding-result.types';

export function buildOnboardingResultFromProfile(
  profile: UserProfile,
  asOfDate: string = getLocalCalendarDate(),
): OnboardingResultState {
  const calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate);
  if (!calculated) {
    return {
      status: 'unavailable',
      reason: mapProfileToHealthScoreInput(profile, asOfDate)
        ? 'result_engine_failure'
        : 'invalid_health_score_input',
    };
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
    return { status: 'unavailable', reason: 'result_engine_failure' };
  }

  const display = getLocalizedCoachPresentation(
    coachState.recommendationId,
    coachState.durationMinutes,
    coachState.frequencyPerWeek,
  );
  const bodyFatAvailable = canPresentBodyFatEstimate(profile);

  return {
    status: 'ready',
    bodyFatAvailable,
    bodyFatPercentLabel: bodyFatAvailable
      ? formatBodyFatPercent(calculated.result.metrics.bodyFatPct)
      : '—',
    healthScoreLabel: formatOnboardingHealthScore(calculated.score),
    coachTitle: display.title,
    coachMessage: formatCoachMessage(display.description),
  };
}

export function buildOnboardingResultFromMeasurements(
  measurements: ProfileMeasurements,
  asOfDate: string = getLocalCalendarDate(),
): OnboardingResultState {
  const draftProfile = draftProfileFromMeasurements(measurements);
  if (!draftProfile) {
    return { status: 'unavailable', reason: 'invalid_health_score_input' };
  }

  return buildOnboardingResultFromProfile(draftProfile, asOfDate);
}

/**
 * Anonymous Ditt utgångsläge is calculated from the visible pending bundle.
 * Authenticated profile is only a fallback when no pending measurements exist.
 */
export function resolveOnboardingResultState(
  pending: ProfileMeasurements | null,
  authenticatedProfile: UserProfile | null,
  asOfDate: string = getLocalCalendarDate(),
): OnboardingResultState {
  if (pending) {
    return buildOnboardingResultFromMeasurements(pending, asOfDate);
  }

  if (authenticatedProfile && isProfileComplete(authenticatedProfile)) {
    return buildOnboardingResultFromProfile(authenticatedProfile, asOfDate);
  }

  return { status: 'unavailable', reason: 'missing_pending_profile' };
}

export function healthScoreInputReadyFromPending(
  pending: ProfileMeasurements | null,
  asOfDate: string = getLocalCalendarDate(),
): boolean {
  const draft = pending ? draftProfileFromMeasurements(pending) : null;
  return Boolean(draft && mapProfileToHealthScoreInput(draft, asOfDate));
}

export function unavailableReasonFromResult(
  state: OnboardingResultState,
): OnboardingResultUnavailableReason | undefined {
  return state.status === 'unavailable' ? state.reason : undefined;
}
