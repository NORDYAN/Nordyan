import {
  COACH_ASK_ALL_FORBIDDEN_FIELDS,
  COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
  COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS,
  COACH_ASK_BAND_LABEL_MAX_LENGTH,
  COACH_ASK_DESCRIPTION_MAX_LENGTH,
  COACH_ASK_EATING_QUALITY_MEANINGS,
  COACH_ASK_ENERGY_MEANINGS,
  COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
  COACH_ASK_INITIAL_LIFESTYLE_OBJECT_KEYS,
  COACH_ASK_INITIAL_LIFESTYLE_SOURCE,
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND,
  COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS,
  COACH_ASK_PAYLOAD_VERSION_V11,
  COACH_ASK_PAYLOAD_VERSION_V12,
  COACH_ASK_PAYLOAD_VERSION_V13,
  COACH_ASK_PAYLOAD_VERSION_V14,
  COACH_ASK_PAYLOAD_VERSION_V15,
  COACH_ASK_PAYLOAD_VERSION_V16,
  COACH_ASK_PAYLOAD_VERSION_V17,
  COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
  COACH_ASK_HEALTH_SCORE_OVERALL_KIND,
  COACH_ASK_PLAN_ADHERENCE_MEANINGS,
  COACH_ASK_QUESTION_MAX_LENGTH,
  COACH_ASK_SLEEP_QUALITY_MEANINGS,
  COACH_ASK_STRESS_MEANINGS,
  COACH_ASK_SUBTITLE_MAX_LENGTH,
  COACH_ASK_TITLE_MAX_LENGTH,
  COACH_ASK_TRAINING_FREQUENCY_KIND,
  COACH_ASK_TRAINING_FREQUENCY_MEANINGS,
  COACH_ASK_WEEKLY_CHECK_IN_BUCKET_ENTRY_KEYS,
  COACH_ASK_WEEKLY_CHECK_IN_OBJECT_KEYS,
  COACH_ASK_WEEKLY_CHECK_IN_SCALE_ENTRY_KEYS,
  COACH_ASK_WEEKLY_CHECK_IN_SOURCE,
  type CoachAskActivityLevel,
  type CoachAskAgeBand,
  type CoachAskAvailability,
  type CoachAskBodyComposition,
  type CoachAskBodyFatReference,
  type CoachAskBodyFatReferenceTableSex,
  type CoachAskDevelopmentState,
  type CoachAskHealthScoreActivity,
  type CoachAskHealthScoreActivityV17,
  type CoachAskHealthState,
  type CoachAskHealthStateV14,
  type CoachAskHealthStateV17,
  type CoachAskInitialLifestyle,
  type CoachAskPayloadVersion,
  type CoachAskPresentationLocale,
  type CoachAskRequest,
  type CoachAskScoreChange,
  type CoachAskScoreChangeV17,
  type CoachAskSex,
  type CoachAskWaistState,
  type CoachAskWeeklyCheckIn,
  type CoachAskWeightState,
  isCoachAskAlcoholConsumptionValue,
  isCoachAskChangeDirection,
  isCoachAskDevelopmentTrend,
  isCoachAskActivityLevel,
  isCoachAskAgeBand,
  isCoachAskBodyFatReferenceAgeGroup,
  isCoachAskBodyFatReferenceMedianComparison,
  isCoachAskBodyFatReferencePositionBand,
  isCoachAskBodyFatReferenceUnavailableReason,
  isCoachAskFocusType,
  isCoachAskHistoryStatus,
  isCoachAskSex,
  COACH_ASK_BODY_FAT_REFERENCE_SOURCE,
  COACH_ASK_BODY_FAT_REFERENCE_TABLE_SEXES,
  isCoachAskLessHealthyFoodFrequencyValue,
  isCoachAskPayloadVersion,
  isCoachAskPresentationLocale,
  isCoachAskRecommendationId,
  isCoachAskTrainingFrequencyValue,
  isCoachAskWeeklyCheckInScaleValue,
} from '../../../../shared/coach-language';

import { CoachRequestValidationError } from './requestValidation';

const ALLOWED_TOP_LEVEL = new Set(['version', 'locale', 'generatedAt', 'context', 'question']);
const ALLOWED_CONTEXT_V11 = new Set([
  'healthState',
  'development',
  'focus',
  'plan',
  'availability',
]);
const ALLOWED_CONTEXT_V12 = new Set([...ALLOWED_CONTEXT_V11, 'weeklyCheckIn']);
const ALLOWED_CONTEXT_V13 = new Set([...ALLOWED_CONTEXT_V12, 'initialLifestyle']);
const ALLOWED_CONTEXT_V14 = new Set([...ALLOWED_CONTEXT_V13, 'ageBand', 'sex']);
const ALLOWED_CONTEXT_V15 = new Set([...ALLOWED_CONTEXT_V14, 'bodyFatReference']);
const ALLOWED_FOCUS = new Set(['type', 'title', 'subtitle']);
const ALLOWED_PLAN = new Set([
  'recommendationId',
  'title',
  'description',
  'durationMinutes',
  'frequencyPerWeek',
]);
const ALLOWED_AVAILABILITY = new Set([
  'healthScoreAvailable',
  'measurementHistoryComparable',
  'sleepDataAvailable',
  'deviceActivityAvailable',
  'integratedHealthAvailable',
  'stepsDataAvailable',
]);
const ALLOWED_HEALTH_STATE = new Set([
  'overallScore',
  'scoreBandLabel',
  'scoreChange',
  'weight',
  'waist',
  'healthScoreActivity',
]);
const ALLOWED_HEALTH_STATE_V14 = new Set([...ALLOWED_HEALTH_STATE, 'bodyComposition']);
const ALLOWED_BODY_COMPOSITION = new Set(['status', 'bodyFatPercent', 'estimationKind']);
const ALLOWED_BODY_FAT_REFERENCE_READY = new Set([
  'status',
  'source',
  'sex',
  'referenceAgeGroup',
  'bodyFatPercent',
  'referenceMedianPercent',
  'comparisonToReferenceMedian',
  'referencePositionBand',
]);
const ALLOWED_BODY_FAT_REFERENCE_UNAVAILABLE = new Set(['status', 'unavailableReason']);
const ALLOWED_DEVELOPMENT = new Set(['trend', 'historyStatus']);
const ALLOWED_SCORE_CHANGE_READY = new Set(['status', 'change', 'direction']);
const ALLOWED_SCORE_CHANGE_INSUFFICIENT = new Set(['status']);
const ALLOWED_SCORE_CHANGE_V17_READY = new Set(['status', 'kind', 'change', 'direction']);
const ALLOWED_SCORE_CHANGE_V17_INSUFFICIENT = new Set(['status', 'kind']);
const ALLOWED_WEIGHT_READY = new Set(['status', 'currentKg', 'changeKg', 'direction']);
const ALLOWED_WEIGHT_INSUFFICIENT = new Set(['status', 'currentKg']);
const ALLOWED_WAIST_READY = new Set(['status', 'currentCm', 'changeCm', 'direction']);
const ALLOWED_WAIST_INSUFFICIENT = new Set(['status', 'currentCm']);
const ALLOWED_ACTIVITY_READY = new Set(['status', 'current', 'change', 'direction']);
const ALLOWED_ACTIVITY_INSUFFICIENT = new Set(['status', 'current']);
const ALLOWED_ACTIVITY_V17_READY = new Set([
  'status',
  'kind',
  'current',
  'change',
  'direction',
  'currentActivityLevel',
  'previousActivityLevel',
]);
const ALLOWED_ACTIVITY_V17_INSUFFICIENT = new Set([
  'status',
  'kind',
  'current',
  'currentActivityLevel',
]);

function isV17Payload(version: CoachAskPayloadVersion): boolean {
  return version === COACH_ASK_PAYLOAD_VERSION_V17;
}

function isBodyCompositionVersion(version: CoachAskPayloadVersion): boolean {
  return (
    version === COACH_ASK_PAYLOAD_VERSION_V14 ||
    version === COACH_ASK_PAYLOAD_VERSION_V15 ||
    version === COACH_ASK_PAYLOAD_VERSION_V16 ||
    version === COACH_ASK_PAYLOAD_VERSION_V17
  );
}

function optionalActivityLevel(value: unknown, field: string): CoachAskActivityLevel | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !isCoachAskActivityLevel(value)) {
    throw new CoachRequestValidationError(`${field} is invalid.`);
  }
  return value;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasUnexpectedKeys(object: Record<string, unknown>, allowed: Set<string>): string[] {
  return Object.keys(object).filter((key) => !allowed.has(key));
}

function assertNoForbiddenKeys(object: Record<string, unknown>, prefix: string): void {
  for (const forbidden of COACH_ASK_ALL_FORBIDDEN_FIELDS) {
    if (forbidden in object) {
      throw new CoachRequestValidationError(`Unexpected field: ${prefix}${forbidden}`);
    }
  }
}

function assertBoundedString(
  value: unknown,
  field: string,
  maxLength: number,
): string {
  if (typeof value !== 'string') {
    throw new CoachRequestValidationError(`${field} must be a string.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new CoachRequestValidationError(`${field} must be a non-empty string.`);
  }
  if (trimmed.length > maxLength) {
    throw new CoachRequestValidationError(`${field} exceeds maximum length.`);
  }
  return trimmed;
}

function assertOptionalBoundedInt(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'number' || !Number.isInteger(value)) {
    throw new CoachRequestValidationError(`${field} must be null or an integer.`);
  }
  if (value < min || value > max) {
    throw new CoachRequestValidationError(`${field} is out of bounds.`);
  }
  return value;
}

function assertFiniteNumber(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new CoachRequestValidationError(`${field} must be a finite number.`);
  }
  if (value < min || value > max) {
    throw new CoachRequestValidationError(`${field} is out of bounds.`);
  }
  return value;
}

function assertNullableFiniteNumber(
  value: unknown,
  field: string,
  min: number,
  max: number,
): number | null {
  if (value === null) {
    return null;
  }
  return assertFiniteNumber(value, field, min, max);
}

function assertFalseLiteral(value: unknown, field: string): false {
  if (value !== false) {
    throw new CoachRequestValidationError(`${field} must be false.`);
  }
  return false;
}

function assertBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') {
    throw new CoachRequestValidationError(`${field} must be boolean.`);
  }
  return value;
}

function validateScoreChange(
  value: unknown,
  version: CoachAskPayloadVersion,
): CoachAskScoreChange | CoachAskScoreChangeV17 {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.healthState.scoreChange must be an object.');
  }
  if (isV17Payload(version)) {
    if (value.kind !== COACH_ASK_HEALTH_SCORE_OVERALL_KIND) {
      throw new CoachRequestValidationError(
        'context.healthState.scoreChange.kind must be health_score_overall.',
      );
    }
    if (value.status === 'insufficient_history') {
      const unexpected = hasUnexpectedKeys(value, ALLOWED_SCORE_CHANGE_V17_INSUFFICIENT);
      if (unexpected.length > 0) {
        throw new CoachRequestValidationError(
          `Unexpected scoreChange fields: ${unexpected.join(', ')}`,
        );
      }
      return { status: 'insufficient_history', kind: COACH_ASK_HEALTH_SCORE_OVERALL_KIND };
    }
    if (value.status !== 'ready') {
      throw new CoachRequestValidationError('context.healthState.scoreChange.status is invalid.');
    }
    const unexpected = hasUnexpectedKeys(value, ALLOWED_SCORE_CHANGE_V17_READY);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(
        `Unexpected scoreChange fields: ${unexpected.join(', ')}`,
      );
    }
    if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
      throw new CoachRequestValidationError('context.healthState.scoreChange.direction is invalid.');
    }
    return {
      status: 'ready',
      kind: COACH_ASK_HEALTH_SCORE_OVERALL_KIND,
      change: assertFiniteNumber(value.change, 'context.healthState.scoreChange.change', -100, 100),
      direction: value.direction,
    };
  }
  if (value.status === 'insufficient_history') {
    const unexpected = hasUnexpectedKeys(value, ALLOWED_SCORE_CHANGE_INSUFFICIENT);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(
        `Unexpected scoreChange fields: ${unexpected.join(', ')}`,
      );
    }
    return { status: 'insufficient_history' };
  }
  if (value.status !== 'ready') {
    throw new CoachRequestValidationError('context.healthState.scoreChange.status is invalid.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_SCORE_CHANGE_READY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected scoreChange fields: ${unexpected.join(', ')}`,
    );
  }
  if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
    throw new CoachRequestValidationError('context.healthState.scoreChange.direction is invalid.');
  }
  return {
    status: 'ready',
    change: assertFiniteNumber(value.change, 'context.healthState.scoreChange.change', -100, 100),
    direction: value.direction,
  };
}

function validateWeight(value: unknown): CoachAskWeightState {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.healthState.weight must be an object.');
  }
  if (value.status === 'insufficient_history') {
    const unexpected = hasUnexpectedKeys(value, ALLOWED_WEIGHT_INSUFFICIENT);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(`Unexpected weight fields: ${unexpected.join(', ')}`);
    }
    return {
      status: 'insufficient_history',
      currentKg: assertNullableFiniteNumber(
        value.currentKg,
        'context.healthState.weight.currentKg',
        20,
        400,
      ),
    };
  }
  if (value.status !== 'ready') {
    throw new CoachRequestValidationError('context.healthState.weight.status is invalid.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_WEIGHT_READY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(`Unexpected weight fields: ${unexpected.join(', ')}`);
  }
  if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
    throw new CoachRequestValidationError('context.healthState.weight.direction is invalid.');
  }
  return {
    status: 'ready',
    currentKg: assertFiniteNumber(value.currentKg, 'context.healthState.weight.currentKg', 20, 400),
    changeKg: assertFiniteNumber(value.changeKg, 'context.healthState.weight.changeKg', -100, 100),
    direction: value.direction,
  };
}

function validateWaist(value: unknown): CoachAskWaistState {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.healthState.waist must be an object.');
  }
  if (value.status === 'insufficient_history') {
    const unexpected = hasUnexpectedKeys(value, ALLOWED_WAIST_INSUFFICIENT);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(`Unexpected waist fields: ${unexpected.join(', ')}`);
    }
    return {
      status: 'insufficient_history',
      currentCm: assertNullableFiniteNumber(
        value.currentCm,
        'context.healthState.waist.currentCm',
        30,
        250,
      ),
    };
  }
  if (value.status !== 'ready') {
    throw new CoachRequestValidationError('context.healthState.waist.status is invalid.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_WAIST_READY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(`Unexpected waist fields: ${unexpected.join(', ')}`);
  }
  if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
    throw new CoachRequestValidationError('context.healthState.waist.direction is invalid.');
  }
  return {
    status: 'ready',
    currentCm: assertFiniteNumber(value.currentCm, 'context.healthState.waist.currentCm', 30, 250),
    changeCm: assertFiniteNumber(value.changeCm, 'context.healthState.waist.changeCm', -100, 100),
    direction: value.direction,
  };
}

function validateHealthScoreActivity(
  value: unknown,
  version: CoachAskPayloadVersion,
): CoachAskHealthScoreActivity | CoachAskHealthScoreActivityV17 {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError(
      'context.healthState.healthScoreActivity must be an object.',
    );
  }
  if (isV17Payload(version)) {
    if (value.kind !== COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND) {
      throw new CoachRequestValidationError(
        'context.healthState.healthScoreActivity.kind must be health_score_activity_component.',
      );
    }
    if (value.status === 'insufficient_history') {
      const unexpected = hasUnexpectedKeys(value, ALLOWED_ACTIVITY_V17_INSUFFICIENT);
      if (unexpected.length > 0) {
        throw new CoachRequestValidationError(
          `Unexpected healthScoreActivity fields: ${unexpected.join(', ')}`,
        );
      }
      return {
        status: 'insufficient_history',
        kind: COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
        current: assertNullableFiniteNumber(
          value.current,
          'context.healthState.healthScoreActivity.current',
          0,
          100,
        ),
        currentActivityLevel: optionalActivityLevel(
          value.currentActivityLevel,
          'context.healthState.healthScoreActivity.currentActivityLevel',
        ),
      };
    }
    if (value.status !== 'ready') {
      throw new CoachRequestValidationError(
        'context.healthState.healthScoreActivity.status is invalid.',
      );
    }
    const unexpected = hasUnexpectedKeys(value, ALLOWED_ACTIVITY_V17_READY);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(
        `Unexpected healthScoreActivity fields: ${unexpected.join(', ')}`,
      );
    }
    if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
      throw new CoachRequestValidationError(
        'context.healthState.healthScoreActivity.direction is invalid.',
      );
    }
    return {
      status: 'ready',
      kind: COACH_ASK_HEALTH_SCORE_ACTIVITY_COMPONENT_KIND,
      current: assertFiniteNumber(
        value.current,
        'context.healthState.healthScoreActivity.current',
        0,
        100,
      ),
      change: assertFiniteNumber(
        value.change,
        'context.healthState.healthScoreActivity.change',
        -100,
        100,
      ),
      direction: value.direction,
      currentActivityLevel: optionalActivityLevel(
        value.currentActivityLevel,
        'context.healthState.healthScoreActivity.currentActivityLevel',
      ),
      previousActivityLevel: optionalActivityLevel(
        value.previousActivityLevel,
        'context.healthState.healthScoreActivity.previousActivityLevel',
      ),
    };
  }
  if (value.status === 'insufficient_history') {
    const unexpected = hasUnexpectedKeys(value, ALLOWED_ACTIVITY_INSUFFICIENT);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(
        `Unexpected healthScoreActivity fields: ${unexpected.join(', ')}`,
      );
    }
    return {
      status: 'insufficient_history',
      current: assertNullableFiniteNumber(
        value.current,
        'context.healthState.healthScoreActivity.current',
        0,
        100,
      ),
    };
  }
  if (value.status !== 'ready') {
    throw new CoachRequestValidationError(
      'context.healthState.healthScoreActivity.status is invalid.',
    );
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_ACTIVITY_READY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected healthScoreActivity fields: ${unexpected.join(', ')}`,
    );
  }
  if (typeof value.direction !== 'string' || !isCoachAskChangeDirection(value.direction)) {
    throw new CoachRequestValidationError(
      'context.healthState.healthScoreActivity.direction is invalid.',
    );
  }
  return {
    status: 'ready',
    current: assertFiniteNumber(
      value.current,
      'context.healthState.healthScoreActivity.current',
      0,
      100,
    ),
    change: assertFiniteNumber(
      value.change,
      'context.healthState.healthScoreActivity.change',
      -100,
      100,
    ),
    direction: value.direction,
  };
}

function validateBodyComposition(value: unknown): CoachAskBodyComposition {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError(
      'context.healthState.bodyComposition must be an object.',
    );
  }
  assertNoForbiddenKeys(value, 'context.healthState.bodyComposition.');
  const unexpected = hasUnexpectedKeys(value, ALLOWED_BODY_COMPOSITION);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected bodyComposition fields: ${unexpected.join(', ')}`,
    );
  }

  if (value.status === 'unavailable') {
    if (value.bodyFatPercent !== null) {
      throw new CoachRequestValidationError(
        'context.healthState.bodyComposition.bodyFatPercent must be null when unavailable.',
      );
    }
    if (value.estimationKind !== 'unavailable') {
      throw new CoachRequestValidationError(
        'context.healthState.bodyComposition.estimationKind must be unavailable.',
      );
    }
    return {
      status: 'unavailable',
      bodyFatPercent: null,
      estimationKind: 'unavailable',
    };
  }

  if (value.status !== 'ready') {
    throw new CoachRequestValidationError(
      'context.healthState.bodyComposition.status is invalid.',
    );
  }
  if (value.estimationKind !== 'calculated_from_latest_snapshot') {
    throw new CoachRequestValidationError(
      'context.healthState.bodyComposition.estimationKind must be calculated_from_latest_snapshot when ready.',
    );
  }

  return {
    status: 'ready',
    bodyFatPercent: assertFiniteNumber(
      value.bodyFatPercent,
      'context.healthState.bodyComposition.bodyFatPercent',
      0.1,
      80,
    ),
    estimationKind: 'calculated_from_latest_snapshot',
  };
}

function validateHealthState(
  value: unknown,
  version: CoachAskPayloadVersion,
): CoachAskHealthState | CoachAskHealthStateV14 | CoachAskHealthStateV17 {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.healthState must be an object.');
  }
  assertNoForbiddenKeys(value, 'context.healthState.');
  const allowed = isBodyCompositionVersion(version)
    ? ALLOWED_HEALTH_STATE_V14
    : ALLOWED_HEALTH_STATE;
  const unexpected = hasUnexpectedKeys(value, allowed);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected healthState fields: ${unexpected.join(', ')}`,
    );
  }

  const base = {
    overallScore: assertFiniteNumber(value.overallScore, 'context.healthState.overallScore', 0, 100),
    scoreBandLabel: assertBoundedString(
      value.scoreBandLabel,
      'context.healthState.scoreBandLabel',
      COACH_ASK_BAND_LABEL_MAX_LENGTH,
    ),
    scoreChange: validateScoreChange(value.scoreChange, version),
    weight: validateWeight(value.weight),
    waist: validateWaist(value.waist),
    healthScoreActivity: validateHealthScoreActivity(value.healthScoreActivity, version),
  };

  if (!isBodyCompositionVersion(version)) {
    return base as CoachAskHealthState;
  }

  if (!('bodyComposition' in value)) {
    throw new CoachRequestValidationError('context.healthState.bodyComposition is required.');
  }

  return {
    ...base,
    bodyComposition: validateBodyComposition(value.bodyComposition),
  };
}

function validateAgeBand(value: unknown): CoachAskAgeBand | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !isCoachAskAgeBand(value)) {
    throw new CoachRequestValidationError('context.ageBand is invalid.');
  }
  return value;
}

function validateSex(value: unknown): CoachAskSex | null {
  if (value === null) {
    return null;
  }
  if (typeof value !== 'string' || !isCoachAskSex(value)) {
    throw new CoachRequestValidationError('context.sex is invalid.');
  }
  return value;
}

function validateBodyFatReference(value: unknown): CoachAskBodyFatReference {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.bodyFatReference must be an object.');
  }
  assertNoForbiddenKeys(value, 'context.bodyFatReference.');

  if (value.status === 'unavailable') {
    const unexpected = hasUnexpectedKeys(value, ALLOWED_BODY_FAT_REFERENCE_UNAVAILABLE);
    if (unexpected.length > 0) {
      throw new CoachRequestValidationError(
        `Unexpected bodyFatReference fields: ${unexpected.join(', ')}`,
      );
    }
    if (
      typeof value.unavailableReason !== 'string' ||
      !isCoachAskBodyFatReferenceUnavailableReason(value.unavailableReason)
    ) {
      throw new CoachRequestValidationError(
        'context.bodyFatReference.unavailableReason is invalid.',
      );
    }
    return {
      status: 'unavailable',
      unavailableReason: value.unavailableReason,
    };
  }

  if (value.status !== 'ready') {
    throw new CoachRequestValidationError('context.bodyFatReference.status is invalid.');
  }

  const unexpected = hasUnexpectedKeys(value, ALLOWED_BODY_FAT_REFERENCE_READY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected bodyFatReference fields: ${unexpected.join(', ')}`,
    );
  }
  if (value.source !== COACH_ASK_BODY_FAT_REFERENCE_SOURCE) {
    throw new CoachRequestValidationError('context.bodyFatReference.source is invalid.');
  }
  if (
    typeof value.sex !== 'string' ||
    !(COACH_ASK_BODY_FAT_REFERENCE_TABLE_SEXES as readonly string[]).includes(value.sex)
  ) {
    throw new CoachRequestValidationError('context.bodyFatReference.sex is invalid.');
  }
  if (
    typeof value.referenceAgeGroup !== 'string' ||
    !isCoachAskBodyFatReferenceAgeGroup(value.referenceAgeGroup)
  ) {
    throw new CoachRequestValidationError(
      'context.bodyFatReference.referenceAgeGroup is invalid.',
    );
  }
  if (
    typeof value.comparisonToReferenceMedian !== 'string' ||
    !isCoachAskBodyFatReferenceMedianComparison(value.comparisonToReferenceMedian)
  ) {
    throw new CoachRequestValidationError(
      'context.bodyFatReference.comparisonToReferenceMedian is invalid.',
    );
  }
  if (
    typeof value.referencePositionBand !== 'string' ||
    !isCoachAskBodyFatReferencePositionBand(value.referencePositionBand)
  ) {
    throw new CoachRequestValidationError(
      'context.bodyFatReference.referencePositionBand is invalid.',
    );
  }

  return {
    status: 'ready',
    source: COACH_ASK_BODY_FAT_REFERENCE_SOURCE,
    sex: value.sex as CoachAskBodyFatReferenceTableSex,
    referenceAgeGroup: value.referenceAgeGroup,
    bodyFatPercent: assertFiniteNumber(
      value.bodyFatPercent,
      'context.bodyFatReference.bodyFatPercent',
      0.1,
      80,
    ),
    referenceMedianPercent: assertFiniteNumber(
      value.referenceMedianPercent,
      'context.bodyFatReference.referenceMedianPercent',
      0.1,
      80,
    ),
    comparisonToReferenceMedian: value.comparisonToReferenceMedian,
    referencePositionBand: value.referencePositionBand,
  };
}

function validateDevelopment(value: unknown): CoachAskDevelopmentState {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.development must be an object.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_DEVELOPMENT);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected development fields: ${unexpected.join(', ')}`,
    );
  }
  if (typeof value.trend !== 'string' || !isCoachAskDevelopmentTrend(value.trend)) {
    throw new CoachRequestValidationError('context.development.trend is invalid.');
  }
  if (typeof value.historyStatus !== 'string' || !isCoachAskHistoryStatus(value.historyStatus)) {
    throw new CoachRequestValidationError('context.development.historyStatus is invalid.');
  }
  return {
    trend: value.trend,
    historyStatus: value.historyStatus,
  };
}

function validateAvailability(value: unknown): CoachAskAvailability {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.availability must be an object.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_AVAILABILITY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected availability fields: ${unexpected.join(', ')}`,
    );
  }

  return {
    healthScoreAvailable: assertBoolean(
      value.healthScoreAvailable,
      'context.availability.healthScoreAvailable',
    ),
    measurementHistoryComparable: assertBoolean(
      value.measurementHistoryComparable,
      'context.availability.measurementHistoryComparable',
    ),
    sleepDataAvailable: assertFalseLiteral(
      value.sleepDataAvailable,
      'context.availability.sleepDataAvailable',
    ),
    deviceActivityAvailable: assertFalseLiteral(
      value.deviceActivityAvailable,
      'context.availability.deviceActivityAvailable',
    ),
    integratedHealthAvailable: assertFalseLiteral(
      value.integratedHealthAvailable,
      'context.availability.integratedHealthAvailable',
    ),
    stepsDataAvailable: assertFalseLiteral(
      value.stepsDataAvailable,
      'context.availability.stepsDataAvailable',
    ),
  };
}

const ALLOWED_WEEKLY_CHECK_IN = new Set(COACH_ASK_WEEKLY_CHECK_IN_OBJECT_KEYS);
const ALLOWED_SCALE_ENTRY = new Set(COACH_ASK_WEEKLY_CHECK_IN_SCALE_ENTRY_KEYS);
const ALLOWED_BUCKET_ENTRY = new Set(COACH_ASK_WEEKLY_CHECK_IN_BUCKET_ENTRY_KEYS);

function validateScaleEntry<
  Polarity extends 'higher_better' | 'higher_worse',
  Meaning extends string,
>(
  value: unknown,
  field: string,
  expectedPolarity: Polarity,
  meanings: Record<1 | 2 | 3 | 4 | 5, Meaning>,
): { value: 1 | 2 | 3 | 4 | 5; polarity: Polarity; meaning: Meaning } {
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError(`${field} must be an object.`);
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_SCALE_ENTRY);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(`Unexpected ${field} fields: ${unexpected.join(', ')}`);
  }
  if (!isCoachAskWeeklyCheckInScaleValue(value.value)) {
    throw new CoachRequestValidationError(`${field}.value is invalid.`);
  }
  if (value.polarity !== expectedPolarity) {
    throw new CoachRequestValidationError(`${field}.polarity is invalid.`);
  }
  const expectedMeaning = meanings[value.value];
  if (value.meaning !== expectedMeaning) {
    throw new CoachRequestValidationError(`${field}.meaning is invalid.`);
  }
  return {
    value: value.value,
    polarity: expectedPolarity,
    meaning: expectedMeaning,
  };
}

function validateWeeklyCheckIn(value: unknown): CoachAskWeeklyCheckIn | null {
  if (value === null) {
    return null;
  }
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.weeklyCheckIn must be an object or null.');
  }
  assertNoForbiddenKeys(value, 'context.weeklyCheckIn.');
  const unexpected = hasUnexpectedKeys(value, ALLOWED_WEEKLY_CHECK_IN);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected weeklyCheckIn fields: ${unexpected.join(', ')}`,
    );
  }
  for (const key of COACH_ASK_WEEKLY_CHECK_IN_OBJECT_KEYS) {
    if (!(key in value)) {
      throw new CoachRequestValidationError(`context.weeklyCheckIn.${key} is required.`);
    }
  }
  if (value.source !== COACH_ASK_WEEKLY_CHECK_IN_SOURCE) {
    throw new CoachRequestValidationError('context.weeklyCheckIn.source is invalid.');
  }

  if (!isPlainObject(value.trainingFrequency)) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.trainingFrequency must be an object.',
    );
  }
  const unexpectedTraining = hasUnexpectedKeys(value.trainingFrequency, ALLOWED_BUCKET_ENTRY);
  if (unexpectedTraining.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected trainingFrequency fields: ${unexpectedTraining.join(', ')}`,
    );
  }
  if (!isCoachAskTrainingFrequencyValue(value.trainingFrequency.value)) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.trainingFrequency.value is invalid.',
    );
  }
  if (
    value.trainingFrequency.meaning !==
    COACH_ASK_TRAINING_FREQUENCY_MEANINGS[value.trainingFrequency.value]
  ) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.trainingFrequency.meaning is invalid.',
    );
  }
  if (value.trainingFrequency.kind !== COACH_ASK_TRAINING_FREQUENCY_KIND) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.trainingFrequency.kind is invalid.',
    );
  }

  if (!isPlainObject(value.alcoholConsumption)) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.alcoholConsumption must be an object.',
    );
  }
  const unexpectedAlcohol = hasUnexpectedKeys(value.alcoholConsumption, ALLOWED_BUCKET_ENTRY);
  if (unexpectedAlcohol.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected alcoholConsumption fields: ${unexpectedAlcohol.join(', ')}`,
    );
  }
  if (!isCoachAskAlcoholConsumptionValue(value.alcoholConsumption.value)) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.alcoholConsumption.value is invalid.',
    );
  }
  if (
    value.alcoholConsumption.meaning !==
    COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[value.alcoholConsumption.value]
  ) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.alcoholConsumption.meaning is invalid.',
    );
  }
  if (value.alcoholConsumption.kind !== COACH_ASK_ALCOHOL_CONSUMPTION_KIND) {
    throw new CoachRequestValidationError(
      'context.weeklyCheckIn.alcoholConsumption.kind is invalid.',
    );
  }

  return {
    source: COACH_ASK_WEEKLY_CHECK_IN_SOURCE,
    sleepQuality: validateScaleEntry(
      value.sleepQuality,
      'context.weeklyCheckIn.sleepQuality',
      'higher_better',
      COACH_ASK_SLEEP_QUALITY_MEANINGS,
    ),
    energy: validateScaleEntry(
      value.energy,
      'context.weeklyCheckIn.energy',
      'higher_better',
      COACH_ASK_ENERGY_MEANINGS,
    ),
    stress: validateScaleEntry(
      value.stress,
      'context.weeklyCheckIn.stress',
      'higher_worse',
      COACH_ASK_STRESS_MEANINGS,
    ),
    trainingFrequency: {
      value: value.trainingFrequency.value,
      meaning: COACH_ASK_TRAINING_FREQUENCY_MEANINGS[value.trainingFrequency.value],
      kind: COACH_ASK_TRAINING_FREQUENCY_KIND,
    },
    everydayActivity: validateScaleEntry(
      value.everydayActivity,
      'context.weeklyCheckIn.everydayActivity',
      'higher_better',
      COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
    ),
    eatingQuality: validateScaleEntry(
      value.eatingQuality,
      'context.weeklyCheckIn.eatingQuality',
      'higher_better',
      COACH_ASK_EATING_QUALITY_MEANINGS,
    ),
    alcoholConsumption: {
      value: value.alcoholConsumption.value,
      meaning: COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[value.alcoholConsumption.value],
      kind: COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
    },
    planAdherence: validateScaleEntry(
      value.planAdherence,
      'context.weeklyCheckIn.planAdherence',
      'higher_better',
      COACH_ASK_PLAN_ADHERENCE_MEANINGS,
    ),
  };
}

const ALLOWED_INITIAL_LIFESTYLE = new Set(COACH_ASK_INITIAL_LIFESTYLE_OBJECT_KEYS);

function validateLessHealthyFoodFrequency(
  value: unknown,
): CoachAskInitialLifestyle['lessHealthyFoodFrequency'] {
  if (value === null) {
    return null;
  }
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.lessHealthyFoodFrequency must be an object or null.',
    );
  }
  const unexpectedNutrition = hasUnexpectedKeys(value, ALLOWED_BUCKET_ENTRY);
  if (unexpectedNutrition.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected lessHealthyFoodFrequency fields: ${unexpectedNutrition.join(', ')}`,
    );
  }
  if (!isCoachAskLessHealthyFoodFrequencyValue(value.value)) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.lessHealthyFoodFrequency.value is invalid.',
    );
  }
  if (
    value.meaning !== COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS[value.value]
  ) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.lessHealthyFoodFrequency.meaning is invalid.',
    );
  }
  if (value.kind !== COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.lessHealthyFoodFrequency.kind is invalid.',
    );
  }
  return {
    value: value.value,
    meaning: COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_MEANINGS[value.value],
    kind: COACH_ASK_LESS_HEALTHY_FOOD_FREQUENCY_KIND,
  };
}

function validateInitialLifestyle(value: unknown): CoachAskInitialLifestyle | null {
  if (value === null) {
    return null;
  }
  if (!isPlainObject(value)) {
    throw new CoachRequestValidationError('context.initialLifestyle must be an object or null.');
  }
  const unexpected = hasUnexpectedKeys(value, ALLOWED_INITIAL_LIFESTYLE);
  if (unexpected.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected initialLifestyle fields: ${unexpected.join(', ')}`,
    );
  }
  for (const key of COACH_ASK_INITIAL_LIFESTYLE_OBJECT_KEYS) {
    if (!(key in value)) {
      throw new CoachRequestValidationError(`context.initialLifestyle.${key} is required.`);
    }
  }
  if (value.source !== COACH_ASK_INITIAL_LIFESTYLE_SOURCE) {
    throw new CoachRequestValidationError('context.initialLifestyle.source is invalid.');
  }

  if (!isPlainObject(value.alcoholConsumption)) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.alcoholConsumption must be an object.',
    );
  }
  const unexpectedAlcohol = hasUnexpectedKeys(value.alcoholConsumption, ALLOWED_BUCKET_ENTRY);
  if (unexpectedAlcohol.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected alcoholConsumption fields: ${unexpectedAlcohol.join(', ')}`,
    );
  }
  if (!isCoachAskAlcoholConsumptionValue(value.alcoholConsumption.value)) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.alcoholConsumption.value is invalid.',
    );
  }
  if (
    value.alcoholConsumption.meaning !==
    COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[value.alcoholConsumption.value]
  ) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.alcoholConsumption.meaning is invalid.',
    );
  }
  if (value.alcoholConsumption.kind !== COACH_ASK_ALCOHOL_CONSUMPTION_KIND) {
    throw new CoachRequestValidationError(
      'context.initialLifestyle.alcoholConsumption.kind is invalid.',
    );
  }

  return {
    source: COACH_ASK_INITIAL_LIFESTYLE_SOURCE,
    sleepQuality: validateScaleEntry(
      value.sleepQuality,
      'context.initialLifestyle.sleepQuality',
      'higher_better',
      COACH_ASK_SLEEP_QUALITY_MEANINGS,
    ),
    energy: validateScaleEntry(
      value.energy,
      'context.initialLifestyle.energy',
      'higher_better',
      COACH_ASK_ENERGY_MEANINGS,
    ),
    stress: validateScaleEntry(
      value.stress,
      'context.initialLifestyle.stress',
      'higher_worse',
      COACH_ASK_STRESS_MEANINGS,
    ),
    lessHealthyFoodFrequency: validateLessHealthyFoodFrequency(value.lessHealthyFoodFrequency),
    everydayActivity: validateScaleEntry(
      value.everydayActivity,
      'context.initialLifestyle.everydayActivity',
      'higher_better',
      COACH_ASK_EVERYDAY_ACTIVITY_MEANINGS,
    ),
    eatingQuality: validateScaleEntry(
      value.eatingQuality,
      'context.initialLifestyle.eatingQuality',
      'higher_better',
      COACH_ASK_EATING_QUALITY_MEANINGS,
    ),
    alcoholConsumption: {
      value: value.alcoholConsumption.value,
      meaning: COACH_ASK_ALCOHOL_CONSUMPTION_MEANINGS[value.alcoholConsumption.value],
      kind: COACH_ASK_ALCOHOL_CONSUMPTION_KIND,
    },
  };
}

function validateAskLocale(
  version: CoachAskPayloadVersion,
  locale: unknown,
): 'sv-SE' | CoachAskPresentationLocale {
  if (version === COACH_ASK_PAYLOAD_VERSION_V16 || version === COACH_ASK_PAYLOAD_VERSION_V17) {
    if (!isCoachAskPresentationLocale(locale)) {
      throw new CoachRequestValidationError('Unsupported locale.');
    }
    return locale;
  }

  if (locale !== 'sv-SE') {
    throw new CoachRequestValidationError('Unsupported locale.');
  }

  return 'sv-SE';
}

function allowedContextKeys(version: CoachAskPayloadVersion): Set<string> {
  if (
    version === COACH_ASK_PAYLOAD_VERSION_V17 ||
    version === COACH_ASK_PAYLOAD_VERSION_V16 ||
    version === COACH_ASK_PAYLOAD_VERSION_V15
  ) {
    return ALLOWED_CONTEXT_V15;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V14) {
    return ALLOWED_CONTEXT_V14;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V13) {
    return ALLOWED_CONTEXT_V13;
  }
  if (version === COACH_ASK_PAYLOAD_VERSION_V12) {
    return ALLOWED_CONTEXT_V12;
  }
  return ALLOWED_CONTEXT_V11;
}

export function validateCoachAskRequest(body: unknown): CoachAskRequest {
  if (!isPlainObject(body)) {
    throw new CoachRequestValidationError('Request body must be a JSON object.');
  }

  assertNoForbiddenKeys(body, '');

  const unexpectedTop = hasUnexpectedKeys(body, ALLOWED_TOP_LEVEL);
  if (unexpectedTop.length > 0) {
    throw new CoachRequestValidationError(`Unexpected fields: ${unexpectedTop.join(', ')}`);
  }

  if (!isCoachAskPayloadVersion(body.version)) {
    throw new CoachRequestValidationError(`Unsupported payload version: ${String(body.version)}`);
  }

  const payloadVersion: CoachAskPayloadVersion = body.version;
  const locale = validateAskLocale(payloadVersion, body.locale);

  if (typeof body.generatedAt !== 'string' || body.generatedAt.length === 0) {
    throw new CoachRequestValidationError('generatedAt must be a non-empty string.');
  }

  const question = assertBoundedString(body.question, 'question', COACH_ASK_QUESTION_MAX_LENGTH);

  if (!isPlainObject(body.context)) {
    throw new CoachRequestValidationError('context must be an object.');
  }

  assertNoForbiddenKeys(body.context, 'context.');

  const allowedContext = allowedContextKeys(payloadVersion);
  const unexpectedContext = hasUnexpectedKeys(body.context, allowedContext);
  if (unexpectedContext.length > 0) {
    throw new CoachRequestValidationError(
      `Unexpected context fields: ${unexpectedContext.join(', ')}`,
    );
  }

  if (!isPlainObject(body.context.focus)) {
    throw new CoachRequestValidationError('context.focus must be an object.');
  }
  const unexpectedFocus = hasUnexpectedKeys(body.context.focus, ALLOWED_FOCUS);
  if (unexpectedFocus.length > 0) {
    throw new CoachRequestValidationError(`Unexpected focus fields: ${unexpectedFocus.join(', ')}`);
  }

  if (typeof body.context.focus.type !== 'string' || !isCoachAskFocusType(body.context.focus.type)) {
    throw new CoachRequestValidationError('context.focus.type is invalid.');
  }

  const focusTitle = assertBoundedString(
    body.context.focus.title,
    'context.focus.title',
    COACH_ASK_TITLE_MAX_LENGTH,
  );
  const focusSubtitle = assertBoundedString(
    body.context.focus.subtitle,
    'context.focus.subtitle',
    COACH_ASK_SUBTITLE_MAX_LENGTH,
  );

  if (!isPlainObject(body.context.plan)) {
    throw new CoachRequestValidationError('context.plan must be an object.');
  }
  const unexpectedPlan = hasUnexpectedKeys(body.context.plan, ALLOWED_PLAN);
  if (unexpectedPlan.length > 0) {
    throw new CoachRequestValidationError(`Unexpected plan fields: ${unexpectedPlan.join(', ')}`);
  }

  if (
    typeof body.context.plan.recommendationId !== 'string' ||
    !isCoachAskRecommendationId(body.context.plan.recommendationId)
  ) {
    throw new CoachRequestValidationError('context.plan.recommendationId is invalid.');
  }

  const planTitle = assertBoundedString(
    body.context.plan.title,
    'context.plan.title',
    COACH_ASK_TITLE_MAX_LENGTH,
  );
  const planDescription = assertBoundedString(
    body.context.plan.description,
    'context.plan.description',
    COACH_ASK_DESCRIPTION_MAX_LENGTH,
  );
  const durationMinutes = assertOptionalBoundedInt(
    body.context.plan.durationMinutes,
    'context.plan.durationMinutes',
    1,
    180,
  );
  const frequencyPerWeek = assertOptionalBoundedInt(
    body.context.plan.frequencyPerWeek,
    'context.plan.frequencyPerWeek',
    1,
    7,
  );

  const availability = validateAvailability(body.context.availability);

  let healthState: CoachAskHealthState | CoachAskHealthStateV14 | undefined;
  if (body.context.healthState !== undefined) {
    healthState = validateHealthState(body.context.healthState, payloadVersion);
  }

  let development: CoachAskDevelopmentState | undefined;
  if (body.context.development !== undefined) {
    development = validateDevelopment(body.context.development);
  }

  if ((healthState != null) !== (development != null)) {
    throw new CoachRequestValidationError(
      'context.healthState and context.development must both be present or both omitted.',
    );
  }

  if (availability.healthScoreAvailable && healthState == null) {
    throw new CoachRequestValidationError(
      'context.availability.healthScoreAvailable requires context.healthState.',
    );
  }

  const sharedContext = {
    ...(healthState ? { healthState, development } : {}),
    focus: {
      type: body.context.focus.type,
      title: focusTitle,
      subtitle: focusSubtitle,
    },
    plan: {
      recommendationId: body.context.plan.recommendationId,
      title: planTitle,
      description: planDescription,
      durationMinutes,
      frequencyPerWeek,
    },
    availability,
  };

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V11) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V11,
      locale: 'sv-SE',
      generatedAt: body.generatedAt,
      context: sharedContext,
      question,
    };
  }

  if (!('weeklyCheckIn' in body.context)) {
    throw new CoachRequestValidationError('context.weeklyCheckIn is required.');
  }

  const weeklyCheckIn = validateWeeklyCheckIn(body.context.weeklyCheckIn);

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V12) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V12,
      locale: 'sv-SE',
      generatedAt: body.generatedAt,
      context: {
        ...sharedContext,
        weeklyCheckIn,
      },
      question,
    };
  }

  if (!('initialLifestyle' in body.context)) {
    throw new CoachRequestValidationError('context.initialLifestyle is required.');
  }

  const initialLifestyle = validateInitialLifestyle(body.context.initialLifestyle);

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V13) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V13,
      locale: 'sv-SE',
      generatedAt: body.generatedAt,
      context: {
        ...sharedContext,
        weeklyCheckIn,
        initialLifestyle,
      },
      question,
    };
  }

  if (!('ageBand' in body.context)) {
    throw new CoachRequestValidationError('context.ageBand is required.');
  }
  if (!('sex' in body.context)) {
    throw new CoachRequestValidationError('context.sex is required.');
  }

  const v14HealthState =
    healthState === undefined
      ? undefined
      : 'bodyComposition' in healthState
        ? healthState
        : (() => {
            throw new CoachRequestValidationError(
              'context.healthState.bodyComposition is required.',
            );
          })();

  const ageBand = validateAgeBand(body.context.ageBand);
  const sex = validateSex(body.context.sex);
  const v14Context = {
    ...(v14HealthState ? { healthState: v14HealthState, development } : {}),
    focus: sharedContext.focus,
    plan: sharedContext.plan,
    availability: sharedContext.availability,
    weeklyCheckIn,
    initialLifestyle,
    ageBand,
    sex,
  };

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V14) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V14,
      locale: 'sv-SE',
      generatedAt: body.generatedAt,
      context: v14Context,
      question,
    };
  }

  if (!('bodyFatReference' in body.context)) {
    throw new CoachRequestValidationError('context.bodyFatReference is required.');
  }

  const v15Context = {
    ...v14Context,
    bodyFatReference: validateBodyFatReference(body.context.bodyFatReference),
  };

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V15) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V15,
      locale: 'sv-SE',
      generatedAt: body.generatedAt,
      context: v15Context,
      question,
    };
  }

  if (!isCoachAskPresentationLocale(locale)) {
    throw new CoachRequestValidationError('Unsupported locale.');
  }

  if (payloadVersion === COACH_ASK_PAYLOAD_VERSION_V16) {
    return {
      version: COACH_ASK_PAYLOAD_VERSION_V16,
      locale,
      generatedAt: body.generatedAt,
      context: v15Context,
      question,
    };
  }

  return {
    version: COACH_ASK_PAYLOAD_VERSION_V17,
    locale,
    generatedAt: body.generatedAt,
    context: v15Context as CoachAskRequest['context'],
    question,
  };
}
