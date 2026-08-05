import type { CreateMeasurementInput } from './measurement.types';

/** Identifies which measurement field failed validation. */
export type MeasurementField = 'userId' | 'measuredAt' | 'weightKg' | 'waistCm' | 'neckCm';

export type MeasurementValidationError = {
  field: MeasurementField;
  message: string;
};

export type MeasurementValidationResult =
  | { valid: true }
  | { valid: false; errors: MeasurementValidationError[] };

/**
 * Context required for domain validation that depends on the current date.
 * Supplied by the caller; the domain layer does not read the system clock directly.
 */
export type MeasurementValidationContext = {
  /** Local calendar date (YYYY-MM-DD) used to reject future measurement dates. */
  todayLocalDate: string;
};

/**
 * Validation contract for measurement input.
 *
 * Expected rules (implemented in a future milestone):
 * - userId must be a non-empty string
 * - weightKg, waistCm, neckCm must be finite numbers greater than zero
 * - measuredAt must be a valid ISO calendar date (YYYY-MM-DD)
 * - measuredAt must not be after todayLocalDate
 */
export interface MeasurementValidator {
  validate(
    input: CreateMeasurementInput,
    context: MeasurementValidationContext,
  ): MeasurementValidationResult;
}
