import type { Result } from '@/lib/core';
import type { DailyHealthSummary, HealthMetric } from '@/lib/domain/health-data';

export interface HealthDataRepository {
  getMetricsByUserId(userId: string): Promise<Result<HealthMetric[]>>;
  getDailySummary(userId: string, date: string): Promise<Result<DailyHealthSummary | null>>;
  upsertMetrics(metrics: HealthMetric[]): Promise<Result<HealthMetric[]>>;
}
