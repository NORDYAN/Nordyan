import type { Result } from '@/lib/core';
import type {
  InitialLifestyleAnswers,
  InitialLifestyleCheck,
} from '@/lib/domain/initial-lifestyle';

export type UpsertInitialLifestyleInput = {
  userId: string;
  answers: InitialLifestyleAnswers;
};

export interface InitialLifestyleRepository {
  getByUser(userId: string): Promise<Result<InitialLifestyleCheck | null>>;
  upsert(input: UpsertInitialLifestyleInput): Promise<Result<InitialLifestyleCheck>>;
}
