import { calculateHealthScore } from '@/lib/domain/health-score';
import type { HealthScoreInput, HealthScoreResult } from '@/lib/domain/health-score';
import type { UserProfile } from '@/lib/domain/profile';

import {
  getLocalCalendarDate,
  mapProfileToHealthScoreInput,
} from './health-score.mapper';
import { getHealthScoreBandDisplayLabel, t } from '@/lib/i18n';
import type { HomeHealthScoreState } from './health-score.service.types';

export function getHomeHealthScoreUnavailableMessage(): string {
  return t('home.healthScore.unavailable');
}

/** Swedish source string; prefer getHomeHealthScoreUnavailableMessage() at runtime. */
export const HOME_HEALTH_SCORE_UNAVAILABLE_MESSAGE = 'Din hälsopoäng kan inte beräknas ännu.';

export type CalculatedHomeHealthScore = {
  score: number;
  subtitle: string;
  input: HealthScoreInput;
  result: HealthScoreResult;
};

export function calculateHomeHealthScoreFromProfile(
  profile: UserProfile | null,
  asOfDate: string = getLocalCalendarDate(),
): CalculatedHomeHealthScore | null {
  if (!profile) {
    return null;
  }

  const input = mapProfileToHealthScoreInput(profile, asOfDate);
  if (!input) {
    return null;
  }

  const engineResult = calculateHealthScore(input);
  if (!engineResult.ok) {
    return null;
  }

  return {
    score: engineResult.value.score,
    subtitle: getHealthScoreBandDisplayLabel(engineResult.value.score),
    input,
    result: engineResult.value,
  };
}

export function buildHomeHealthScoreState(
  profile: UserProfile | null,
  isProfileLoading: boolean,
  asOfDate: string = getLocalCalendarDate(),
): HomeHealthScoreState {
  if (isProfileLoading) {
    return { status: 'loading' };
  }

  const calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate);
  if (!calculated) {
    return {
      status: 'unavailable',
      message: getHomeHealthScoreUnavailableMessage(),
    };
  }

  return {
    status: 'ready',
    score: calculated.score,
    subtitle: calculated.subtitle,
    input: calculated.input,
    result: calculated.result,
  };
}
