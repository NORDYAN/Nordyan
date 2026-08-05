import type { Result } from '@/lib/core';
import type { DailyHealthSummary, HealthMetric } from '@/lib/domain/health-data';

export interface HealthDataService {
  getRecentMetrics(): Promise<Result<HealthMetric[]>>;
  getTodaySummary(): Promise<Result<DailyHealthSummary | null>>;
}
