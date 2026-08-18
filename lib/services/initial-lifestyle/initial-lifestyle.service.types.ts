import type { Result } from '@/lib/core';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';

export interface InitialLifestyleService {
  get(userId: string): Promise<Result<InitialLifestyleCheck | null>>;
  save(userId: string, answers: unknown): Promise<Result<InitialLifestyleCheck>>;
}
