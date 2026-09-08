import type { Result } from '@/lib/core';
import type { UserProfile } from '@/lib/domain/profile';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import type { DevelopmentHomeSummary } from '@/lib/services/development';
import type { WeeklyCheckInCurrentWeek } from '@/lib/services/weekly-check-in';
import {
  mapAgeBandFromDateOfBirth,
  mapBodyCompositionFromSnapshot,
  mapBodyFatReferenceForCoachAsk,
  mapCoachAskSex,
  mapInitialLifestyleForCoachAsk,
  mapWeeklyCheckInForCoachAsk,
} from '@/lib/services/coach-context';
import type { CoachAskBodyComposition, CoachAskFocusType } from '@/shared/coach-language';

import { mapCoachQuickQuestionSignals } from './coach-quick-questions.signals';
import type { CoachQuickQuestionSignals } from '@/lib/domain/coach-quick-questions';

const UNAVAILABLE_BODY_COMPOSITION: CoachAskBodyComposition = {
  status: 'unavailable',
  bodyFatPercent: null,
  estimationKind: 'unavailable',
};

export type LoadCoachQuickQuestionSignalsDeps = {
  getDevelopmentHomeSummary: (userId: string) => Promise<Result<DevelopmentHomeSummary>>;
  getCurrentWeekWeeklyCheckIn: (userId: string) => Promise<Result<WeeklyCheckInCurrentWeek>>;
  getInitialLifestyle: (userId: string) => Promise<Result<InitialLifestyleCheck | null>>;
  getLatestSnapshot: (userId: string) => Promise<Result<HealthSnapshot | null>>;
  getProfile: (userId: string) => Promise<Result<UserProfile | null>>;
  getWeeklyFocusImproveAreas?: (userId: string) => Promise<readonly WeeklyFocusArea[]>;
};

export async function loadCoachQuickQuestionSignals(input: {
  userId: string;
  hasHealthContext: boolean;
  focusType: CoachAskFocusType | null;
  deps: LoadCoachQuickQuestionSignalsDeps;
}): Promise<CoachQuickQuestionSignals> {
  const { userId, deps } = input;

  const weeklyFocusPromise = deps.getWeeklyFocusImproveAreas
    ? deps.getWeeklyFocusImproveAreas(userId).catch(() => [])
    : Promise.resolve([]);

  const [developmentResult, weeklyResult, lifestyleResult, snapshotResult, profileResult, weeklyFocus] =
    await Promise.all([
      deps.getDevelopmentHomeSummary(userId).catch(() => null),
      deps.getCurrentWeekWeeklyCheckIn(userId).catch(() => null),
      deps.getInitialLifestyle(userId).catch(() => null),
      deps.getLatestSnapshot(userId).catch(() => null),
      deps.getProfile(userId).catch(() => null),
      weeklyFocusPromise,
    ]);

  const development: DevelopmentHomeSummary =
    developmentResult?.ok === true ? developmentResult.value : { status: 'empty' };
  const weeklyCheckIn =
    weeklyResult?.ok === true && weeklyResult.value.status === 'ready'
      ? mapWeeklyCheckInForCoachAsk(weeklyResult.value.checkIn)
      : null;
  const initialLifestyle =
    lifestyleResult?.ok === true && lifestyleResult.value
      ? mapInitialLifestyleForCoachAsk(lifestyleResult.value)
      : null;
  const profile = profileResult?.ok === true ? profileResult.value : null;
  const bodyComposition = snapshotResult?.ok
    ? mapBodyCompositionFromSnapshot(snapshotResult.value, profile)
    : UNAVAILABLE_BODY_COMPOSITION;
  const bodyFatReference = mapBodyFatReferenceForCoachAsk({
    bodyComposition,
    ageBand: mapAgeBandFromDateOfBirth(profile?.dateOfBirth),
    sex: mapCoachAskSex(profile?.gender),
  });

  return mapCoachQuickQuestionSignals({
    hasHealthContext: input.hasHealthContext,
    focusType: input.focusType,
    development,
    weeklyCheckIn,
    initialLifestyle,
    bodyComposition,
    bodyFatReference,
    weeklyFocusImproveAreas: weeklyFocus,
  });
}
