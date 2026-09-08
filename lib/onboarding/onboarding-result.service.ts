import { isProfileComplete, type ProfileMeasurements, type UserProfile } from '@/lib/domain/profile';
import { getLocalizedCoachPresentation } from '@/lib/i18n';
import {
  buildHomeCoachState,
  formatCoachMessage,
  type HomeCoachState,
} from '@/lib/services/coach';
import { buildHomePrimaryFocusState, type HomePrimaryFocusState } from '@/lib/services/focus';
import {
  canPresentBodyFatEstimate,
  calculateHomeHealthScoreFromProfile,
  formatBodyFatPercent,
  getLocalCalendarDate,
  type HomeHealthScoreState,
} from '@/lib/services/health-score';
import {
  mapProfileToHealthScoreInput,
  type HealthScoreProfileOptions,
} from '@/lib/services/health-score/health-score.mapper';

import type { OnboardingResultUnavailableReason } from './onboarding-forensics';
import { draftProfileFromMeasurements } from './onboarding-result.mapper';
import {
  formatOnboardingHealthScore,
  getOnboardingResultCoachFallback,
} from './onboarding-result.presentation';
import type { OnboardingResultState } from './onboarding-result.types';

export type OnboardingResultPresentationDeps = {
  buildHomePrimaryFocusState: (healthScoreState: HomeHealthScoreState) => HomePrimaryFocusState;
  buildHomeCoachState: (
    profile: UserProfile | null,
    healthScoreState: HomeHealthScoreState,
    primaryFocusState: HomePrimaryFocusState,
  ) => HomeCoachState;
};

const defaultOnboardingResultPresentationDeps: OnboardingResultPresentationDeps = {
  buildHomePrimaryFocusState,
  buildHomeCoachState,
};

function resolveOnboardingCoachCopy(
  profile: UserProfile,
  healthScoreState: HomeHealthScoreState,
  deps: OnboardingResultPresentationDeps,
): { coachTitle: string; coachMessage: string } {
  const focusState = deps.buildHomePrimaryFocusState(healthScoreState);
  const coachState = deps.buildHomeCoachState(profile, healthScoreState, focusState);
  if (coachState.status !== 'ready') {
    return getOnboardingResultCoachFallback();
  }

  const display = getLocalizedCoachPresentation(
    coachState.recommendationId,
    coachState.durationMinutes,
    coachState.frequencyPerWeek,
  );
  return {
    coachTitle: display.title,
    coachMessage: formatCoachMessage(display.description),
  };
}

export function buildOnboardingResultFromProfile(
  profile: UserProfile,
  asOfDate: string = getLocalCalendarDate(),
  options?: HealthScoreProfileOptions,
  presentationDeps: OnboardingResultPresentationDeps = defaultOnboardingResultPresentationDeps,
): OnboardingResultState {
  const calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate, options);
  if (!calculated) {
    return {
      status: 'unavailable',
      reason: mapProfileToHealthScoreInput(profile, asOfDate, options)
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

  const coach = resolveOnboardingCoachCopy(profile, healthScoreState, presentationDeps);
  const bodyFatAvailable = canPresentBodyFatEstimate(profile, {
    waistCm: profile.waistCm,
    neckCm: profile.neckCm,
    hipCm: options?.hipCm ?? null,
    snapshotReason: 'onboarding',
    bodyFatPct: calculated.result.metrics.bodyFatPct,
    bodyFatMethod: calculated.result.metrics.bodyFatMethod,
  });

  return {
    status: 'ready',
    bodyFatAvailable,
    bodyFatPercentLabel: bodyFatAvailable
      ? formatBodyFatPercent(calculated.result.metrics.bodyFatPct)
      : '—',
    healthScoreLabel: formatOnboardingHealthScore(calculated.score),
    coachTitle: coach.coachTitle,
    coachMessage: coach.coachMessage,
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

  return buildOnboardingResultFromProfile(draftProfile, asOfDate, {
    hipCm: measurements.hipCm,
  });
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
  return Boolean(
    draft && mapProfileToHealthScoreInput(draft, asOfDate, { hipCm: pending?.hipCm }),
  );
}

export function unavailableReasonFromResult(
  state: OnboardingResultState,
): OnboardingResultUnavailableReason | undefined {
  return state.status === 'unavailable' ? state.reason : undefined;
}
