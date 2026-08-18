import {
  INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS,
  INITIAL_LIFESTYLE_ANSWER_FIELDS,
  INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES,
  INITIAL_LIFESTYLE_SCALE_FIELDS,
  INITIAL_LIFESTYLE_SCALE_MAX,
  INITIAL_LIFESTYLE_SCALE_MIN,
  type InitialLifestyleAlcoholConsumption,
  type InitialLifestyleAnswers,
  type InitialLifestyleLessHealthyFoodFrequency,
  type InitialLifestyleScale,
  type InitialLifestyleScaleField,
} from './initial-lifestyle.types';
import type {
  InitialLifestyleAnswersValidationResult,
  InitialLifestyleAnswersValidator,
  InitialLifestyleValidationError,
} from './initial-lifestyle.validation';

const ALLOWED_ANSWER_KEYS = new Set<string>(INITIAL_LIFESTYLE_ANSWER_FIELDS);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInitialLifestyleScale(value: unknown): value is InitialLifestyleScale {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= INITIAL_LIFESTYLE_SCALE_MIN &&
    value <= INITIAL_LIFESTYLE_SCALE_MAX
  );
}

function isLessHealthyFoodFrequency(
  value: unknown,
): value is InitialLifestyleLessHealthyFoodFrequency {
  return (
    typeof value === 'string' &&
    (INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES as readonly string[]).includes(value)
  );
}

function isAlcoholConsumption(value: unknown): value is InitialLifestyleAlcoholConsumption {
  return (
    typeof value === 'string' &&
    (INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS as readonly string[]).includes(value)
  );
}

export class DefaultInitialLifestyleAnswersValidator
  implements InitialLifestyleAnswersValidator
{
  validate(input: unknown): InitialLifestyleAnswersValidationResult {
    const errors: InitialLifestyleValidationError[] = [];

    if (!isPlainObject(input)) {
      return {
        valid: false,
        errors: [{ field: 'answers', message: 'Livsstilssvar krävs.' }],
      };
    }

    const unexpectedKeys = Object.keys(input).filter((key) => !ALLOWED_ANSWER_KEYS.has(key));
    if (unexpectedKeys.length > 0) {
      errors.push({
        field: 'answers',
        message: 'Okända fält är inte tillåtna.',
      });
    }

    for (const field of INITIAL_LIFESTYLE_SCALE_FIELDS) {
      if (!(field in input) || input[field] === undefined || input[field] === null) {
        errors.push({ field, message: 'Svar krävs.' });
        continue;
      }
      if (!isInitialLifestyleScale(input[field])) {
        errors.push({ field, message: 'Ange ett heltal mellan 1 och 5.' });
      }
    }

    if (!('lessHealthyFoodFrequency' in input) || input.lessHealthyFoodFrequency == null) {
      errors.push({ field: 'lessHealthyFoodFrequency', message: 'Svar krävs.' });
    } else if (!isLessHealthyFoodFrequency(input.lessHealthyFoodFrequency)) {
      errors.push({ field: 'lessHealthyFoodFrequency', message: 'Ogiltig matfrekvens.' });
    }

    if (!('alcoholConsumption' in input) || input.alcoholConsumption == null) {
      errors.push({ field: 'alcoholConsumption', message: 'Svar krävs.' });
    } else if (!isAlcoholConsumption(input.alcoholConsumption)) {
      errors.push({ field: 'alcoholConsumption', message: 'Ogiltig alkoholkonsumtion.' });
    }

    if (errors.length > 0) {
      return { valid: false, errors };
    }

    const value: InitialLifestyleAnswers = {
      sleepQuality: input.sleepQuality as InitialLifestyleScale,
      energy: input.energy as InitialLifestyleScale,
      stress: input.stress as InitialLifestyleScale,
      lessHealthyFoodFrequency:
        input.lessHealthyFoodFrequency as InitialLifestyleLessHealthyFoodFrequency,
      everydayActivity: input.everydayActivity as InitialLifestyleScale,
      eatingQuality: input.eatingQuality as InitialLifestyleScale,
      alcoholConsumption: input.alcoholConsumption as InitialLifestyleAlcoholConsumption,
    };

    return { valid: true, value };
  }
}

export const initialLifestyleAnswersValidator: InitialLifestyleAnswersValidator =
  new DefaultInitialLifestyleAnswersValidator();

export function isInitialLifestyleScaleValue(
  value: unknown,
): value is InitialLifestyleScale {
  return isInitialLifestyleScale(value);
}

export function isInitialLifestyleScaleField(
  value: string,
): value is InitialLifestyleScaleField {
  return (INITIAL_LIFESTYLE_SCALE_FIELDS as readonly string[]).includes(value);
}
