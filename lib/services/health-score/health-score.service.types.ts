import type { Result } from '@/lib/core';
import type { HealthScore, HealthScoreTrend } from '@/lib/domain/health-score';
import type { HealthScoreInput, HealthScoreResult } from '@/lib/domain/health-score';
import type { ProfileMeasurements } from '@/lib/domain/profile';

export interface HealthScoreService {
  calculateInitialEstimate(measurements: ProfileMeasurements): Promise<Result<HealthScore>>;
  getLatestScore(): Promise<Result<HealthScore | null>>;
  getTrend(): Promise<Result<HealthScoreTrend | null>>;
}

export type HomeHealthScoreState =
  | { status: 'loading' }
  | {
      status: 'ready';
      score: number;
      subtitle: string;
      input: HealthScoreInput;
      result: HealthScoreResult;
    }
  | { status: 'unavailable'; message: string };
