import type { Result } from '@/lib/core';
import {
  getActiveLocale,
  getHealthScoreBandDisplayLabel,
  getLocalizedCoachPresentation,
  getLocalizedFocusPresentation,
  type AppLocale,
} from '@/lib/i18n';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import type { UserProfile } from '@/lib/domain/profile';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { CoachHomeSummary } from '@/lib/services/coach-home';
import type {
  DevelopmentHomeSummary,
  DevelopmentNumericDelta,
} from '@/lib/services/development';
import type { WeeklyCheckInCurrentWeek } from '@/lib/services/weekly-check-in';
import {
  resolveCoachRecommendationPresentationTier,
  type CoachRecommendationPresentationSignals,
} from '@/lib/presentation/coach-recommendation';
import {
  COACH_ASK_PAYLOAD_VERSION,
  mapAppLocaleToCoachAskLocale,
  type CoachAskAgeBand,
  type CoachAskAvailability,
  type CoachAskBodyComposition,
  type CoachAskChangeDirection,
  type CoachAskDevelopmentState,
  type CoachAskFocusType,
  COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
  COACH_ASK_HEALTH_SCORE_OVERALL_KIND,
  mapHealthScoreActivityComponentToLevel,
  type CoachAskHealthScoreActivityV17,
  type CoachAskHealthStateV17,
  type CoachAskRequestV17,
  type CoachAskScoreChangeV17,
  type CoachAskHistoryStatus,
  type CoachAskInitialLifestyle,
  type CoachAskSex,
  type CoachAskWaistState,
  type CoachAskWeeklyCheckIn,
  type CoachAskWeightState,
  isCoachAskFocusType,
  isCoachAskRecommendationId,
} from '@/shared/coach-language';

import {
  mapAgeBandFromDateOfBirth,
  mapBodyCompositionFromSnapshot,
  mapCoachAskSex,
} from './coach-ask-body-composition.mapper';
import { mapBodyFatReferenceForCoachAsk } from './coach-ask-body-fat-reference.mapper';
import { mapInitialLifestyleForCoachAsk } from './coach-ask-initial-lifestyle.mapper';
import { mapWeeklyCheckInForCoachAsk } from './coach-ask-weekly-check-in.mapper';
import type { CoachAskComposeResult } from './coach-context.types';

export function toCoachAskChangeDirection(change: number): CoachAskChangeDirection {
  if (change > 0) {
    return 'up';
  }
  if (change < 0) {
    return 'down';
  }
  return 'stable';
}

function mapScoreChange(delta: DevelopmentNumericDelta): CoachAskScoreChangeV17 {
  if (delta.status === 'insufficient_history') {
    return { status: 'insufficient_history', kind: COACH_ASK_HEALTH_SCORE_OVERALL_KIND };
  }
  return {
    status: 'ready',
    kind: COACH_ASK_HEALTH_SCORE_OVERALL_KIND,
    change: delta.change,
    direction: toCoachAskChangeDirection(delta.change),
  };
}

function mapWeight(delta: DevelopmentNumericDelta): CoachAskWeightState {
  if (delta.status === 'insufficient_history') {
    return { status: 'insufficient_history', currentKg: delta.current };
  }
  return {
    status: 'ready',
    currentKg: delta.current,
    changeKg: delta.change,
    direction: toCoachAskChangeDirection(delta.change),
  };
}

function mapWaist(delta: DevelopmentNumericDelta): CoachAskWaistState {
  if (delta.status === 'insufficient_history') {
    return { status: 'insufficient_history', currentCm: delta.current };
  }
  return {
    status: 'ready',
    currentCm: delta.current,
    changeCm: delta.change,
    direction: toCoachAskChangeDirection(delta.change),
  };
}

function mapHealthScoreActivity(delta: DevelopmentNumericDelta): CoachAskHealthScoreActivityV17 {
  if (delta.status === 'insufficient_history') {
    return {
      status: 'insufficient_history',
      kind: COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
      current: delta.current,
      currentActivityLevel: mapHealthScoreActivityComponentToLevel(delta.current),
    };
  }
  return {
    status: 'ready',
    kind: COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
    current: delta.current,
    change: delta.change,
    direction: toCoachAskChangeDirection(delta.change),
    currentActivityLevel: mapHealthScoreActivityComponentToLevel(delta.current),
    previousActivityLevel: mapHealthScoreActivityComponentToLevel(delta.previous),
  };
}

function mapHealthState(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
  bodyComposition: CoachAskBodyComposition,
  locale: AppLocale,
): CoachAskHealthStateV17 {
  return {
    overallScore: summary.currentScore,
    scoreBandLabel: getHealthScoreBandDisplayLabel(summary.currentScore, locale),
    scoreChange: mapScoreChange(summary.scoreChange),
    weight: mapWeight(summary.weight),
    waist: mapWaist(summary.waist),
    healthScoreActivity: mapHealthScoreActivity(summary.activity),
    bodyComposition,
  };
}

function mapDevelopment(
  summary: Extract<DevelopmentHomeSummary, { status: 'ready' }>,
): CoachAskDevelopmentState {
  const historyStatus: CoachAskHistoryStatus =
    summary.trend === 'insufficient_history' ||
    summary.scoreChange.status === 'insufficient_history'
      ? 'insufficient_history'
      : 'comparable';

  return {
    trend: summary.trend,
    historyStatus,
  };
}

function buildAvailability(
  development: DevelopmentHomeSummary,
): CoachAskAvailability {
  const healthScoreAvailable = development.status === 'ready';
  const measurementHistoryComparable =
    development.status === 'ready' &&
    development.trend !== 'insufficient_history' &&
    development.scoreChange.status !== 'insufficient_history';

  return {
    healthScoreAvailable,
    measurementHistoryComparable,
    sleepDataAvailable: false,
    deviceActivityAvailable: false,
    integratedHealthAvailable: false,
    stepsDataAvailable: false,
  };
}

const UNAVAILABLE_BODY_COMPOSITION: CoachAskBodyComposition = {
  status: 'unavailable',
  bodyFatPercent: null,
  estimationKind: 'unavailable',
};

/**
 * Pure composition of Coach Ask v1.7 context from existing frozen summaries.
 * Plan numeric dose follows Step 4 presentation tier: GENERAL omits a
 * personalized prescription; SPECIFIC may include engine minutes/frequency.
 * Engine values stay on Coach Home / snapshots. Does not call engines.
 */
export function buildCoachAskRequestFromSummaries(input: {
  coachHome: CoachHomeSummary;
  development: DevelopmentHomeSummary;
  question: string;
  generatedAt?: string;
  locale?: 'sv' | 'nb';
  weeklyCheckIn?: CoachAskWeeklyCheckIn | null;
  initialLifestyle?: CoachAskInitialLifestyle | null;
  bodyComposition?: CoachAskBodyComposition;
  ageBand?: CoachAskAgeBand | null;
  sex?: CoachAskSex | null;
  presentationSignals?: CoachRecommendationPresentationSignals;
}): CoachAskComposeResult {
  const { coachHome, development, question } = input;

  if (coachHome.status === 'empty') {
    return { status: 'unavailable', reason: 'empty' };
  }

  if (coachHome.plan.available !== true) {
    return { status: 'unavailable', reason: 'no_plan' };
  }

  if (!isCoachAskFocusType(coachHome.focus.type)) {
    return { status: 'unavailable', reason: 'empty' };
  }

  if (!isCoachAskRecommendationId(coachHome.plan.recommendationId)) {
    return { status: 'unavailable', reason: 'no_plan' };
  }

  const focusType: CoachAskFocusType = coachHome.focus.type;
  const availability = buildAvailability(development);
  const bodyComposition = input.bodyComposition ?? UNAVAILABLE_BODY_COMPOSITION;
  const ageBand = input.ageBand ?? null;
  const sex = input.sex ?? null;
  const appLocale = input.locale ?? getActiveLocale();
  const focusPresentation = getLocalizedFocusPresentation(focusType, appLocale);
  const planPresentation = getLocalizedCoachPresentation(
    coachHome.plan.recommendationId,
    coachHome.plan.durationMinutes,
    coachHome.plan.frequencyPerWeek,
    appLocale,
    input.presentationSignals,
  );
  const exposeNumericDose =
    resolveCoachRecommendationPresentationTier(
      coachHome.plan.recommendationId,
      input.presentationSignals,
    ) === 'specific';

  const context: CoachAskRequestV17['context'] = {
    focus: {
      type: focusType,
      title: focusPresentation.title,
      subtitle: focusPresentation.subtitle,
    },
    plan: {
      recommendationId: coachHome.plan.recommendationId,
      title: planPresentation.title,
      description: planPresentation.description,
      durationMinutes: exposeNumericDose ? coachHome.plan.durationMinutes : null,
      frequencyPerWeek: exposeNumericDose ? coachHome.plan.frequencyPerWeek : null,
    },
    availability,
    weeklyCheckIn: input.weeklyCheckIn ?? null,
    initialLifestyle: input.initialLifestyle ?? null,
    ageBand,
    sex,
    bodyFatReference: mapBodyFatReferenceForCoachAsk({
      bodyComposition,
      ageBand,
      sex,
    }),
  };

  if (development.status === 'ready') {
    context.healthState = mapHealthState(development, bodyComposition, appLocale);
    context.development = mapDevelopment(development);
  }

  return {
    status: 'ready',
    request: {
      version: COACH_ASK_PAYLOAD_VERSION,
      locale: mapAppLocaleToCoachAskLocale(appLocale),
      generatedAt: input.generatedAt ?? new Date().toISOString(),
      context,
      question: question.trim(),
    },
  };
}

export type ComposeCoachAskRequestDeps = {
  getCoachHomeSummary: (userId: string) => Promise<Result<CoachHomeSummary>>;
  getDevelopmentHomeSummary: (userId: string) => Promise<Result<DevelopmentHomeSummary>>;
  getCurrentWeekWeeklyCheckIn: (userId: string) => Promise<Result<WeeklyCheckInCurrentWeek>>;
  getInitialLifestyle: (userId: string) => Promise<Result<InitialLifestyleCheck | null>>;
  getLatestSnapshot: (userId: string) => Promise<Result<HealthSnapshot | null>>;
  getProfile: (userId: string) => Promise<Result<UserProfile | null>>;
};

/**
 * Weekly Check-in enrichment is optional. Empty, error, throw, or mapping
 * failure all become null and must not fail Coach Ask.
 */
export async function loadWeeklyCheckInContext(
  getCurrentWeekWeeklyCheckIn: ComposeCoachAskRequestDeps['getCurrentWeekWeeklyCheckIn'],
  userId: string,
): Promise<CoachAskWeeklyCheckIn | null> {
  try {
    const result = await getCurrentWeekWeeklyCheckIn(userId);
    if (!result.ok || result.value.status !== 'ready') {
      return null;
    }
    return mapWeeklyCheckInForCoachAsk(result.value.checkIn);
  } catch {
    return null;
  }
}

/**
 * Initial Lifestyle enrichment is optional. Missing row, error, throw, or
 * mapping failure all become null and must not fail Coach Ask.
 */
export async function loadInitialLifestyleContext(
  getInitialLifestyle: ComposeCoachAskRequestDeps['getInitialLifestyle'],
  userId: string,
): Promise<CoachAskInitialLifestyle | null> {
  try {
    const result = await getInitialLifestyle(userId);
    if (!result.ok || result.value === null) {
      return null;
    }
    return mapInitialLifestyleForCoachAsk(result.value);
  } catch {
    return null;
  }
}

/**
 * Snapshot body-fat enrichment is optional. Error, throw, or missing snapshot
 * become unavailable and must not fail Coach Ask.
 */
export async function loadBodyCompositionContext(
  getLatestSnapshot: ComposeCoachAskRequestDeps['getLatestSnapshot'],
  getProfile: ComposeCoachAskRequestDeps['getProfile'],
  userId: string,
): Promise<{
  bodyComposition: CoachAskBodyComposition;
  ageSex: { ageBand: CoachAskAgeBand | null; sex: CoachAskSex | null };
}> {
  const [snapshotResult, profileResult] = await Promise.all([
    getLatestSnapshot(userId).catch(() => null),
    getProfile(userId).catch(() => null),
  ]);
  const profile = profileResult?.ok ? profileResult.value : null;

  return {
    bodyComposition: snapshotResult?.ok
      ? mapBodyCompositionFromSnapshot(snapshotResult.value, profile)
      : UNAVAILABLE_BODY_COMPOSITION,
    ageSex: {
      ageBand: mapAgeBandFromDateOfBirth(profile?.dateOfBirth),
      sex: mapCoachAskSex(profile?.gender),
    },
  };
}

/**
 * ageBand/sex enrichment is optional. Error, throw, or missing profile become
 * null. Date of birth is used only locally and never returned.
 */
export async function loadAgeSexContext(
  getProfile: ComposeCoachAskRequestDeps['getProfile'],
  userId: string,
): Promise<{ ageBand: CoachAskAgeBand | null; sex: CoachAskSex | null }> {
  try {
    const result = await getProfile(userId);
    if (!result.ok || result.value === null) {
      return { ageBand: null, sex: null };
    }
    return {
      ageBand: mapAgeBandFromDateOfBirth(result.value.dateOfBirth),
      sex: mapCoachAskSex(result.value.gender),
    };
  } catch {
    return { ageBand: null, sex: null };
  }
}

/**
 * Thin Coach Context composer: Coach Home + Development Home + optional
 * current-week Weekly Check-in + optional onboarding Initial Lifestyle +
 * snapshot body composition + derived ageBand/sex.
 * Enrichment fetches are isolated and fail-closed.
 */
export async function composeCoachAskRequest(
  userId: string,
  question: string,
  deps: ComposeCoachAskRequestDeps,
  locale?: AppLocale,
  presentationSignals?: CoachRecommendationPresentationSignals,
): Promise<Result<CoachAskComposeResult>> {
  const trimmedQuestion = question.trim();
  if (!userId.trim() || !trimmedQuestion) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: 'userId och question krävs.' },
    };
  }

  const [coachResult, developmentResult, weeklyCheckIn, initialLifestyle, bodyFatContext] =
    await Promise.all([
      deps.getCoachHomeSummary(userId),
      deps.getDevelopmentHomeSummary(userId),
      loadWeeklyCheckInContext(deps.getCurrentWeekWeeklyCheckIn, userId),
      loadInitialLifestyleContext(deps.getInitialLifestyle, userId),
      loadBodyCompositionContext(deps.getLatestSnapshot, deps.getProfile, userId),
    ]);

  if (!coachResult.ok) {
    return coachResult;
  }
  if (!developmentResult.ok) {
    return developmentResult;
  }

  return {
    ok: true,
    value: buildCoachAskRequestFromSummaries({
      coachHome: coachResult.value,
      development: developmentResult.value,
      question: trimmedQuestion,
      locale,
      weeklyCheckIn,
      initialLifestyle,
      bodyComposition: bodyFatContext.bodyComposition,
      ageBand: bodyFatContext.ageSex.ageBand,
      sex: bodyFatContext.ageSex.sex,
      presentationSignals,
    }),
  };
}
