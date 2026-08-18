import type { WeeklyCheckInAnswerField, WeeklyCheckInAnswers } from './weekly-check-in.types';

export type WeeklyCheckInValidationError = {
  field: WeeklyCheckInAnswerField | 'answers';
  message: string;
};

export type WeeklyCheckInAnswersValidationResult =
  | { valid: true; value: WeeklyCheckInAnswers }
  | { valid: false; errors: WeeklyCheckInValidationError[] };

export interface WeeklyCheckInAnswersValidator {
  validate(input: unknown): WeeklyCheckInAnswersValidationResult;
}
