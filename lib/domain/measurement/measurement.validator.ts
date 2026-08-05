import type { CreateMeasurementInput } from './measurement.types';
import type {
  MeasurementValidationContext,
  MeasurementValidationError,
  MeasurementValidationResult,
  MeasurementValidator,
} from './measurement.validation';

function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function isPositiveFinite(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export class DefaultMeasurementValidator implements MeasurementValidator {
  validate(
    input: CreateMeasurementInput,
    context: MeasurementValidationContext,
  ): MeasurementValidationResult {
    const errors: MeasurementValidationError[] = [];

    if (!input.userId.trim()) {
      errors.push({ field: 'userId', message: 'Användare krävs.' });
    }

    if (!isValidIsoDate(input.measuredAt)) {
      errors.push({ field: 'measuredAt', message: 'Ogiltigt datum.' });
    } else if (input.measuredAt > context.todayLocalDate) {
      errors.push({ field: 'measuredAt', message: 'Datum får inte ligga i framtiden.' });
    }

    if (!isPositiveFinite(input.weightKg)) {
      errors.push({ field: 'weightKg', message: 'Ange en giltig vikt.' });
    }

    if (!isPositiveFinite(input.waistCm)) {
      errors.push({ field: 'waistCm', message: 'Ange ett giltigt midjemått.' });
    }

    if (!isPositiveFinite(input.neckCm)) {
      errors.push({ field: 'neckCm', message: 'Ange ett giltigt halsmått.' });
    }

    if (errors.length === 0) {
      return { valid: true };
    }

    return { valid: false, errors };
  }
}

export const measurementValidator: MeasurementValidator = new DefaultMeasurementValidator();
