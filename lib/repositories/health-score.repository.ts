import type { Result } from '@/lib/core';
import type { HealthScore, HealthScoreTrend } from '@/lib/domain/health-score';

export interface HealthScoreRepository {
  getLatestByUserId(userId: string): Promise<Result<HealthScore | null>>;
  getTrend(userId: string): Promise<Result<HealthScoreTrend | null>>;
  save(score: HealthScore): Promise<Result<HealthScore>>;
}
