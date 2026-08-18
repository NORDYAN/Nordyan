import type {
  InitialLifestyleAnswerField,
  InitialLifestyleAnswers,
} from './initial-lifestyle.types';

export type InitialLifestyleValidationError = {
  field: InitialLifestyleAnswerField | 'answers';
  message: string;
};

export type InitialLifestyleAnswersValidationResult =
  | { valid: true; value: InitialLifestyleAnswers }
  | { valid: false; errors: InitialLifestyleValidationError[] };

export interface InitialLifestyleAnswersValidator {
  validate(input: unknown): InitialLifestyleAnswersValidationResult;
}
