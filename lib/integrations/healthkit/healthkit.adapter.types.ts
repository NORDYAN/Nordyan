import type { Result } from '@/lib/core';
import type { HealthMetric } from '@/lib/domain/health-data';

import type { HealthKitAuthorizationStatus, HealthKitMetricType } from './types';

export interface HealthKitAdapter {
  getAuthorizationStatus(): Promise<Result<HealthKitAuthorizationStatus>>;
  requestAuthorization(types: HealthKitMetricType[]): Promise<Result<void>>;
  fetchLatestMetrics(userId: string): Promise<Result<HealthMetric[]>>;
}
