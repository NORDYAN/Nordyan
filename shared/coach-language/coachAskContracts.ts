import { FORBIDDEN_REQUEST_FIELDS } from './coachContracts';
import type { CoachAskInitialLifestyle } from './coachAskInitialLifestyle';
import type { CoachAskWeeklyCheckIn } from './coachAskWeeklyCheckIn';

export const COACH_ASK_PAYLOAD_VERSION_V11 = 'coach-ask-v1.1' as const;
export const COACH_ASK_PAYLOAD_VERSION_V12 = 'coach-ask-v1.2' as const;
export const COACH_ASK_PAYLOAD_VERSION_V13 = 'coach-ask-v1.3' as const;
export const COACH_ASK_PAYLOAD_VERSION_V14 = 'coach-ask-v1.4' as const;
export const COACH_ASK_PAYLOAD_VERSION_V15 = 'coach-ask-v1.5' as const;
export const COACH_ASK_PAYLOAD_VERSION_V16 = 'coach-ask-v1.6' as const;
export const COACH_ASK_PAYLOAD_VERSION_V17 = 'coach-ask-v1.7' as const;
/** Current client composer version. Server accepts v1.1–v1.7. v1.6 remains frozen. */
export const COACH_ASK_PAYLOAD_VERSION = COACH_ASK_PAYLOAD_VERSION_V17;

export const NORDYAN_COACH_ASK_PROMPT_VERSION_V11 = 'nordyan-coach-ask-v1.1' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V12 = 'nordyan-coach-ask-v1.2' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V13 = 'nordyan-coach-ask-v1.3' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V14 = 'nordyan-coach-ask-v1.4' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V15 = 'nordyan-coach-ask-v1.5' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V16 = 'nordyan-coach-ask-v1.6' as const;
export const NORDYAN_COACH_ASK_PROMPT_VERSION_V17 = 'nordyan-coach-ask-v1.7' as const;
/** Current client prompt. Server selects prompt by payload version. */
export const NORDYAN_COACH_ASK_PROMPT_VERSION = NORDYAN_COACH_ASK_PROMPT_VERSION_V17;

export const COACH_ASK_PRESENTATION_LOCALES = ['sv-SE', 'nb-NO'] as const;
export type CoachAskPresentationLocale = (typeof COACH_ASK_PRESENTATION_LOCALES)[number];

export type CoachAskPayloadVersion =
  | typeof COACH_ASK_PAYLOAD_VERSION_V11
  | typeof COACH_ASK_PAYLOAD_VERSION_V12
  | typeof COACH_ASK_PAYLOAD_VERSION_V13
  | typeof COACH_ASK_PAYLOAD_VERSION_V14
  | typeof COACH_ASK_PAYLOAD_VERSION_V15
  | typeof COACH_ASK_PAYLOAD_VERSION_V16
  | typeof COACH_ASK_PAYLOAD_VERSION_V17;

export const COACH_ASK_QUESTION_MAX_LENGTH = 280;
export const COACH_ASK_TITLE_MAX_LENGTH = 80;
export const COACH_ASK_SUBTITLE_MAX_LENGTH = 240;
export const COACH_ASK_DESCRIPTION_MAX_LENGTH = 400;
export const COACH_ASK_BAND_LABEL_MAX_LENGTH = 80;

export const COACH_ASK_FOCUS_TYPES = [
  'reduce_waist',
  'improve_activity',
  'improve_body_composition',
  'improve_weight_balance',
  'maintain_current_path',
] as const;

export type CoachAskFocusType = (typeof COACH_ASK_FOCUS_TYPES)[number];

/** Allowlisted recommendation IDs from deterministic Coach presentation catalog. */
export const COACH_ASK_RECOMMENDATION_IDS = [
  'waist_walk_after_dinner_v1',
  'waist_increase_walking_volume_v1',
  'waist_active_walk_progression_v1',
  'waist_measurement_follow_up_v1',
  'activity_sedentary_walk_start_v1',
  'activity_light_walk_build_v1',
  'activity_moderate_brisk_walk_v1',
  'activity_active_structured_movement_v1',
  'activity_very_active_strength_v1',
  'body_comp_daily_walk_v1',
  'body_comp_walk_strength_combo_v1',
  'body_comp_strength_foundation_v1',
  'weight_balance_gentle_nutrition_v1',
  'weight_balance_walking_v1',
  'weight_balance_active_movement_v1',
  'weight_balance_measurement_check_v1',
  'maintain_weekly_check_in_v1',
  'maintain_routine_consistency_v1',
  'fallback_gentle_walk_v1',
] as const;

export type CoachAskRecommendationId = (typeof COACH_ASK_RECOMMENDATION_IDS)[number];

export const COACH_ASK_CHANGE_DIRECTIONS = ['up', 'down', 'stable'] as const;
export type CoachAskChangeDirection = (typeof COACH_ASK_CHANGE_DIRECTIONS)[number];

export const COACH_ASK_DEVELOPMENT_TRENDS = [
  'improving',
  'declining',
  'stable',
  'insufficient_history',
] as const;
export type CoachAskDevelopmentTrend = (typeof COACH_ASK_DEVELOPMENT_TRENDS)[number];

export const COACH_ASK_HISTORY_STATUSES = ['comparable', 'insufficient_history'] as const;
export type CoachAskHistoryStatus = (typeof COACH_ASK_HISTORY_STATUSES)[number];

/**
 * NORDYAN Health Score activity driver (`activity_score`).
 * NOT steps, Apple Health, Health Connect, or wearable device activity.
 * v1.1–v1.6 shape. v1.7 uses CoachAskHealthScoreActivityV17.
 */
export type CoachAskHealthScoreActivity =
  | {
      status: 'ready';
      current: number;
      change: number;
      direction: CoachAskChangeDirection;
    }
  | {
      status: 'insufficient_history';
      current: number | null;
    };

export const COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND =
  'health_score_activity_component' as const;
export const COACH_ASK_HEALTH_SCORE_OVERALL_KIND = 'health_score_overall' as const;

/** Frozen Health Score activity_score bands. Do not invent other levels. */
export const COACH_ASK_ACTIVITY_COMPONENT_SCORES = {
  sedentary: 35,
  light: 50,
  moderate: 68,
  active: 82,
  very_active: 92,
} as const;

export const COACH_ASK_ACTIVITY_LEVELS = [
  'sedentary',
  'light',
  'moderate',
  'active',
  'very_active',
] as const;
export type CoachAskActivityLevel = (typeof COACH_ASK_ACTIVITY_LEVELS)[number];

export function mapHealthScoreActivityComponentToLevel(
  score: number | null | undefined,
): CoachAskActivityLevel | null {
  if (score == null || !Number.isFinite(score)) {
    return null;
  }
  const rounded = Math.round(score);
  for (const level of COACH_ASK_ACTIVITY_LEVELS) {
    if (COACH_ASK_ACTIVITY_COMPONENT_SCORES[level] === rounded) {
      return level;
    }
  }
  return null;
}

export function isCoachAskActivityLevel(value: string): value is CoachAskActivityLevel {
  return (COACH_ASK_ACTIVITY_LEVELS as readonly string[]).includes(value);
}

/**
 * v1.7 activity component. `current` / `change` are Health Score points, never
 * real-world activity units. Levels are present only when the score matches a
 * frozen band exactly.
 */
export type CoachAskHealthScoreActivityV17 =
  | {
      status: 'ready';
      kind: typeof COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND;
      current: number;
      change: number;
      direction: CoachAskChangeDirection;
      currentActivityLevel: CoachAskActivityLevel | null;
      previousActivityLevel: CoachAskActivityLevel | null;
    }
  | {
      status: 'insufficient_history';
      kind: typeof COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND;
      current: number | null;
      currentActivityLevel: CoachAskActivityLevel | null;
    };

export type CoachAskScoreChange =
  | {
      status: 'ready';
      change: number;
      direction: CoachAskChangeDirection;
    }
  | {
      status: 'insufficient_history';
    };

/** v1.7 overall Health Score delta. `change` is score points, not kg/cm/steps. */
export type CoachAskScoreChangeV17 =
  | {
      status: 'ready';
      kind: typeof COACH_ASK_HEALTH_SCORE_OVERALL_KIND;
      change: number;
      direction: CoachAskChangeDirection;
    }
  | {
      status: 'insufficient_history';
      kind: typeof COACH_ASK_HEALTH_SCORE_OVERALL_KIND;
    };

export type CoachAskWeightState =
  | {
      status: 'ready';
      currentKg: number;
      changeKg: number;
      direction: CoachAskChangeDirection;
    }
  | {
      status: 'insufficient_history';
      currentKg: number | null;
    };

export type CoachAskWaistState =
  | {
      status: 'ready';
      currentCm: number;
      changeCm: number;
      direction: CoachAskChangeDirection;
    }
  | {
      status: 'insufficient_history';
      currentCm: number | null;
    };

export type CoachAskHealthState = {
  overallScore: number;
  scoreBandLabel: string;
  scoreChange: CoachAskScoreChange;
  weight: CoachAskWeightState;
  waist: CoachAskWaistState;
  /** Health Score activity driver — never steps/device activity. */
  healthScoreActivity: CoachAskHealthScoreActivity;
};

export const COACH_ASK_BODY_COMPOSITION_ESTIMATION_KINDS = [
  'calculated_from_latest_snapshot',
  'unavailable',
] as const;
export type CoachAskBodyCompositionEstimationKind =
  (typeof COACH_ASK_BODY_COMPOSITION_ESTIMATION_KINDS)[number];

export type CoachAskBodyComposition =
  | {
      status: 'ready';
      bodyFatPercent: number;
      estimationKind: 'calculated_from_latest_snapshot';
    }
  | {
      status: 'unavailable';
      bodyFatPercent: null;
      estimationKind: 'unavailable';
    };

export type CoachAskHealthStateV14 = CoachAskHealthState & {
  bodyComposition: CoachAskBodyComposition;
};

export type CoachAskHealthStateV17 = Omit<
  CoachAskHealthStateV14,
  'scoreChange' | 'healthScoreActivity'
> & {
  scoreChange: CoachAskScoreChangeV17;
  healthScoreActivity: CoachAskHealthScoreActivityV17;
};

export const COACH_ASK_BODY_FAT_REFERENCE_SOURCE =
  'acsm_getp_10_11_cooper_institute' as const;

export const COACH_ASK_BODY_FAT_REFERENCE_AGE_GROUPS = [
  '20_29',
  '30_39',
  '40_49',
  '50_59',
  '60_69',
] as const;
export type CoachAskBodyFatReferenceAgeGroup =
  (typeof COACH_ASK_BODY_FAT_REFERENCE_AGE_GROUPS)[number];

export const COACH_ASK_BODY_FAT_REFERENCE_MEDIAN_COMPARISONS = [
  'below',
  'approximately',
  'above',
] as const;
export type CoachAskBodyFatReferenceMedianComparison =
  (typeof COACH_ASK_BODY_FAT_REFERENCE_MEDIAN_COMPARISONS)[number];

export const COACH_ASK_BODY_FAT_REFERENCE_POSITION_BANDS = [
  'below_tabulated_range',
  'below_median',
  'near_median',
  'above_median',
  'above_tabulated_range',
] as const;
export type CoachAskBodyFatReferencePositionBand =
  (typeof COACH_ASK_BODY_FAT_REFERENCE_POSITION_BANDS)[number];

export const COACH_ASK_BODY_FAT_REFERENCE_UNAVAILABLE_REASONS = [
  'missing_body_fat_percent',
  'missing_sex',
  'missing_age_band',
  'unsupported_sex',
] as const;
export type CoachAskBodyFatReferenceUnavailableReason =
  (typeof COACH_ASK_BODY_FAT_REFERENCE_UNAVAILABLE_REASONS)[number];

export const COACH_ASK_BODY_FAT_REFERENCE_TABLE_SEXES = ['male', 'female'] as const;
export type CoachAskBodyFatReferenceTableSex =
  (typeof COACH_ASK_BODY_FAT_REFERENCE_TABLE_SEXES)[number];

/**
 * Deterministic ACSM/Cooper comparison result. Never the raw percentile table.
 * comparisonToReferenceMedian is in body-fat % space: below = lower % than median.
 */
export type CoachAskBodyFatReference =
  | {
      status: 'ready';
      source: typeof COACH_ASK_BODY_FAT_REFERENCE_SOURCE;
      sex: CoachAskBodyFatReferenceTableSex;
      referenceAgeGroup: CoachAskBodyFatReferenceAgeGroup;
      bodyFatPercent: number;
      referenceMedianPercent: number;
      comparisonToReferenceMedian: CoachAskBodyFatReferenceMedianComparison;
      referencePositionBand: CoachAskBodyFatReferencePositionBand;
    }
  | {
      status: 'unavailable';
      unavailableReason: CoachAskBodyFatReferenceUnavailableReason;
    };

export const COACH_ASK_AGE_BANDS = [
  '18_29',
  '30_39',
  '40_49',
  '50_59',
  '60_plus',
] as const;
export type CoachAskAgeBand = (typeof COACH_ASK_AGE_BANDS)[number];

export const COACH_ASK_SEX_VALUES = ['male', 'female', 'other'] as const;
export type CoachAskSex = (typeof COACH_ASK_SEX_VALUES)[number];

export type CoachAskDevelopmentState = {
  trend: CoachAskDevelopmentTrend;
  historyStatus: CoachAskHistoryStatus;
};

export type CoachAskAvailability = {
  healthScoreAvailable: boolean;
  measurementHistoryComparable: boolean;
  /** Product fact: Sprint 25 has no sleep data. */
  sleepDataAvailable: false;
  /** Product fact: Sprint 25 has no wearable/device activity stream. */
  deviceActivityAvailable: false;
  /** Product fact: no Apple Health / Health Connect integration. */
  integratedHealthAvailable: false;
  /** Product fact: no step counts. Distinct from healthScoreActivity. */
  stepsDataAvailable: false;
};

export type CoachAskContextBase = {
  /** Present when Development Home summary is ready. */
  healthState?: CoachAskHealthState;
  /** Present when Development Home summary is ready. */
  development?: CoachAskDevelopmentState;
  focus: {
    type: CoachAskFocusType;
    title: string;
    subtitle: string;
  };
  plan: {
    recommendationId: string;
    title: string;
    description: string;
    durationMinutes: number | null;
    frequencyPerWeek: number | null;
  };
  availability: CoachAskAvailability;
};

export type CoachAskRequestV11 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V11;
  locale: 'sv-SE';
  generatedAt: string;
  context: CoachAskContextBase;
  question: string;
};

export type CoachAskRequestV12 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V12;
  locale: 'sv-SE';
  generatedAt: string;
  context: CoachAskContextBase & {
    /** Required v1.2 key. null when current-week Weekly Check-in is absent or failed. */
    weeklyCheckIn: CoachAskWeeklyCheckIn | null;
  };
  question: string;
};

export type CoachAskRequestV13 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V13;
  locale: 'sv-SE';
  generatedAt: string;
  context: CoachAskContextBase & {
    /** Required v1.3 key. null when current-week Weekly Check-in is absent or failed. */
    weeklyCheckIn: CoachAskWeeklyCheckIn | null;
    /** Required v1.3 key. null when onboarding baseline is absent or failed. */
    initialLifestyle: CoachAskInitialLifestyle | null;
  };
  question: string;
};

export type CoachAskRequestV14 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V14;
  locale: 'sv-SE';
  generatedAt: string;
  context: Omit<CoachAskContextBase, 'healthState'> & {
    healthState?: CoachAskHealthStateV14;
    weeklyCheckIn: CoachAskWeeklyCheckIn | null;
    initialLifestyle: CoachAskInitialLifestyle | null;
    /** Derived locally. Never DOB or exact age. */
    ageBand: CoachAskAgeBand | null;
    /** Minimum semantic sex enum. Never a profile object. */
    sex: CoachAskSex | null;
  };
  question: string;
};

export type CoachAskRequestV15 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V15;
  locale: 'sv-SE';
  generatedAt: string;
  context: CoachAskRequestV14['context'] & {
    /** Deterministic ACSM comparison. Never the raw table. */
    bodyFatReference: CoachAskBodyFatReference;
  };
  question: string;
};

/** v1.6 is v1.5 context plus presentation locale sv-SE | nb-NO. Health fields unchanged. */
export type CoachAskRequestV16 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V16;
  locale: CoachAskPresentationLocale;
  generatedAt: string;
  context: CoachAskRequestV15['context'];
  question: string;
};

/** v1.7 labels Health Score component deltas. Weight/waist stay measurement units. */
export type CoachAskRequestV17 = {
  version: typeof COACH_ASK_PAYLOAD_VERSION_V17;
  locale: CoachAskPresentationLocale;
  generatedAt: string;
  context: Omit<CoachAskRequestV16['context'], 'healthState'> & {
    healthState?: CoachAskHealthStateV17;
  };
  question: string;
};

export type CoachAskRequest =
  | CoachAskRequestV11
  | CoachAskRequestV12
  | CoachAskRequestV13
  | CoachAskRequestV14
  | CoachAskRequestV15
  | CoachAskRequestV16
  | CoachAskRequestV17;

export type CoachAskResponseSource = 'ai' | 'unavailable';

export type CoachAskResponse = {
  answer: string;
  meta: {
    source: CoachAskResponseSource;
    requestId: string;
    latencyMs?: number;
    promptVersion?: string;
  };
};

/**
 * Extra fields rejected on /ask (in addition to FORBIDDEN_REQUEST_FIELDS).
 * Arbitrary top-level / loose healthScore injection remains forbidden.
 * Structured `context.healthState` is allowlisted separately in validation.
 */
export const COACH_ASK_EXTRA_FORBIDDEN_FIELDS = [
  'healthScore',
  'health_score',
  'healthScoreBand',
  'instructions',
  'system',
  'messages',
  'extraContext',
  'previousMessages',
  'limitations',
  'measurementHistory',
  'bmiScore',
  'whtrScore',
  'bodyFatScore',
  'bodyFatPct',
  'bodyFatCategory',
  'bodyFatMethod',
  'percentile',
  'acsmTable',
  'referenceTable',
  'ageYears',
  'exactAge',
  'heightCm',
  'height',
  'hipCm',
  'hip',
  'neckCm',
  'neck',
  'activityLevel',
  'activity_level',
  'initial_lifestyle',
  'lessHealthyFoodFrequency',
  'weekStartDate',
  'week_start_date',
  'createdAt',
  'updatedAt',
  'created_at',
  'updated_at',
  'notes',
  'weeklyCheckInId',
] as const;

export const COACH_ASK_ALL_FORBIDDEN_FIELDS = [
  ...FORBIDDEN_REQUEST_FIELDS,
  ...COACH_ASK_EXTRA_FORBIDDEN_FIELDS,
] as const;

export function isCoachAskFocusType(value: string): value is CoachAskFocusType {
  return (COACH_ASK_FOCUS_TYPES as readonly string[]).includes(value);
}

export function isCoachAskRecommendationId(value: string): boolean {
  return (COACH_ASK_RECOMMENDATION_IDS as readonly string[]).includes(value);
}

export function isCoachAskChangeDirection(value: string): value is CoachAskChangeDirection {
  return (COACH_ASK_CHANGE_DIRECTIONS as readonly string[]).includes(value);
}

export function isCoachAskDevelopmentTrend(value: string): value is CoachAskDevelopmentTrend {
  return (COACH_ASK_DEVELOPMENT_TRENDS as readonly string[]).includes(value);
}

export function isCoachAskHistoryStatus(value: string): value is CoachAskHistoryStatus {
  return (COACH_ASK_HISTORY_STATUSES as readonly string[]).includes(value);
}

export function isCoachAskPayloadVersion(value: unknown): value is CoachAskPayloadVersion {
  return (
    value === COACH_ASK_PAYLOAD_VERSION_V11 ||
    value === COACH_ASK_PAYLOAD_VERSION_V12 ||
    value === COACH_ASK_PAYLOAD_VERSION_V13 ||
    value === COACH_ASK_PAYLOAD_VERSION_V14 ||
    value === COACH_ASK_PAYLOAD_VERSION_V15 ||
    value === COACH_ASK_PAYLOAD_VERSION_V16 ||
    value === COACH_ASK_PAYLOAD_VERSION_V17
  );
}

export function isCoachAskPresentationLocale(
  value: unknown,
): value is CoachAskPresentationLocale {
  return value === 'sv-SE' || value === 'nb-NO';
}

export function mapAppLocaleToCoachAskLocale(
  locale: 'sv' | 'nb',
): CoachAskPresentationLocale {
  return locale === 'nb' ? 'nb-NO' : 'sv-SE';
}

export function isCoachAskRequestV12(request: CoachAskRequest): request is CoachAskRequestV12 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V12;
}

export function isCoachAskRequestV13(request: CoachAskRequest): request is CoachAskRequestV13 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V13;
}

export function isCoachAskRequestV14(request: CoachAskRequest): request is CoachAskRequestV14 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V14;
}

export function isCoachAskRequestV15(request: CoachAskRequest): request is CoachAskRequestV15 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V15;
}

export function isCoachAskRequestV16(request: CoachAskRequest): request is CoachAskRequestV16 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V16;
}

export function isCoachAskRequestV17(request: CoachAskRequest): request is CoachAskRequestV17 {
  return request.version === COACH_ASK_PAYLOAD_VERSION_V17;
}

export function isCoachAskAgeBand(value: string): value is CoachAskAgeBand {
  return (COACH_ASK_AGE_BANDS as readonly string[]).includes(value);
}

export function isCoachAskSex(value: string): value is CoachAskSex {
  return (COACH_ASK_SEX_VALUES as readonly string[]).includes(value);
}

export function isCoachAskBodyCompositionEstimationKind(
  value: string,
): value is CoachAskBodyCompositionEstimationKind {
  return (COACH_ASK_BODY_COMPOSITION_ESTIMATION_KINDS as readonly string[]).includes(value);
}

export function isCoachAskBodyFatReferenceMedianComparison(
  value: string,
): value is CoachAskBodyFatReferenceMedianComparison {
  return (COACH_ASK_BODY_FAT_REFERENCE_MEDIAN_COMPARISONS as readonly string[]).includes(value);
}

export function isCoachAskBodyFatReferencePositionBand(
  value: string,
): value is CoachAskBodyFatReferencePositionBand {
  return (COACH_ASK_BODY_FAT_REFERENCE_POSITION_BANDS as readonly string[]).includes(value);
}

export function isCoachAskBodyFatReferenceUnavailableReason(
  value: string,
): value is CoachAskBodyFatReferenceUnavailableReason {
  return (COACH_ASK_BODY_FAT_REFERENCE_UNAVAILABLE_REASONS as readonly string[]).includes(value);
}

export function isCoachAskBodyFatReferenceAgeGroup(
  value: string,
): value is CoachAskBodyFatReferenceAgeGroup {
  return (COACH_ASK_BODY_FAT_REFERENCE_AGE_GROUPS as readonly string[]).includes(value);
}

export function getCoachAskPromptVersion(
  version: CoachAskPayloadVersion,
):
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V11
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V12
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V13
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V14
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V15
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V16
  | typeof NORDYAN_COACH_ASK_PROMPT_VERSION_V17 {
  if (version === COACH_ASK_PAYLOAD_VERSION_V17) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V17;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V16) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V16;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V15) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V15;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V14) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V14;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V13) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V13;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V12) {
    return NORDYAN_COACH_ASK_PROMPT_VERSION_V12;
  }
  return NORDYAN_COACH_ASK_PROMPT_VERSION_V11;
}
