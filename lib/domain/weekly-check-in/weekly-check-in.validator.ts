import {
  WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS,
  WEEKLY_CHECK_IN_ANSWER_FIELDS,
  WEEKLY_CHECK_IN_SCALE_FIELDS,
  WEEKLY_CHECK_IN_SCALE_MAX,
  WEEKLY_CHECK_IN_SCALE_MIN,
  WEEKLY_CHECK_IN_TRAINING_FREQUENCIES,
  type WeeklyCheckInAlcoholConsumption,
  type WeeklyCheckInAnswers,
  type WeeklyCheckInScale,
  type WeeklyCheckInScaleField,
  type WeeklyCheckInTrainingFrequency,
} from './weekly-check-in.types';
import type {
  WeeklyCheckInAnswersValidationResult,
  WeeklyCheckInAnswersValidator,
  WeeklyCheckInValidationError,
} from './weekly-check-in.validation';

const ALLOWED_ANSWER_KEYS = new Set<string>(WEEKLY_CHECK_IN_ANSWER_FIELDS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isWeeklyCheckInScale(value: unknown): value is WeeklyCheckInScale {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= WEEKLY_CHECK_IN_SCALE_MIN &&
    value <= WEEKLY_CHECK_IN_SCALE_MAX
  );
}

function isTrainingFrequency(value: unknown): value is WeeklyCheckInTrainingFrequency {
  return (
    typeof value === 'string' &&
    (WEEKLY_CHECK_IN_TRAINING_FREQUENCIES as readonly string[]).includes(value)
  );
}

function isAlcoholConsumption(value: unknown): value is WeeklyCheckInAlcoholConsumption {
  return (
    typeof value === 'string' &&
    (WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS as readonly string[]).includes(value)
  );
}

export class DefaultWeeklyCheckInAnswersValidator implements WeeklyCheckInAnswersValidator {
  validate(input: unknown): WeeklyCheckInAnswersValidationResult {
    const errors: WeeklyCheckInValidationError[] = [];

    if (!isPlainObject(input)) {
      return {
        valid: false,
        errors: [{ field: 'answers', message: 'Veckokoll-svar krävs.' }],
      };
    }

    const unexpectedKeys = Object.keys(input).filter((key) => !ALLOWED_ANSWER_KEYS.has(key));
    if (unexpectedKeys.length > 0) {
      errors.push({
        field: 'answers',
        message: 'Okända fält är inte tillåtna.',
      });
    }

    for (const field of WEEKLY_CHECK_IN_SCALE_FIELDS) {
      if (!(field in input) || input[field] === undefined || input[field] === null) {
        errors.push({ field, message: 'Svar krävs.' });
        continue;
      }
      if (!isWeeklyCheckInScale(input[field])) {
        errors.push({ field, message: 'Ange ett heltal mellan 1 och 5.' });
      }
    }

    if (!('trainingFrequency' in input) || input.trainingFrequency == null) {
      errors.push({ field: 'trainingFrequency', message: 'Svar krävs.' });
    } else if (!isTrainingFrequency(input.trainingFrequency)) {
      errors.push({ field: 'trainingFrequency', message: 'Ogiltig träningsfrekvens.' });
    }

    if (!('alcoholConsumption' in input) || input.alcoholConsumption == null) {
      errors.push({ field: 'alcoholConsumption', message: 'Svar krävs.' });
    } else if (!isAlcoholConsumption(input.alcoholConsumption)) {
      errors.push({ field: 'alcoholConsumption', message: 'Ogiltig alkoholkonsumtion.' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const value: WeeklyCheckInAnswers = {
      sleepQuality: input.sleepQuality as WeeklyCheckInScale,
      energy: input.energy as WeeklyCheckInScale,
      stress: input.stress as WeeklyCheckInScale,
      trainingFrequency: input.trainingFrequency as WeeklyCheckInTrainingFrequency,
      everydayActivity: input.everydayActivity as WeeklyCheckInScale,
      eatingQuality: input.eatingQuality as WeeklyCheckInScale,
      alcoholConsumption: input.alcoholConsumption as WeeklyCheckInAlcoholConsumption,
      planAdherence: input.planAdherence as WeeklyCheckInScale,
    };

    return { valid: true, value };
  }
}

export const weeklyCheckInAnswersValidator: WeeklyCheckInAnswersValidator =
  new DefaultWeeklyCheckInAnswersValidator();

export function isWeeklyCheckInScaleValue(value: unknown): value is WeeklyCheckInScale {
  return isWeeklyCheckInScale(value);
}

export function isWeeklyCheckInScaleField(value: string): value is WeeklyCheckInScaleField {
  return (WEEKLY_CHECK_IN_SCALE_FIELDS as readonly string[]).includes(value);
}
