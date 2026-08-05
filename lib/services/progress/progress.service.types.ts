import type { Result } from '@/lib/core';
import type { ProgressSummary } from '@/lib/domain/progress';

export interface ProgressService {
  getProgressSummary(userId: string): Promise<Result<ProgressSummary>>;
}
