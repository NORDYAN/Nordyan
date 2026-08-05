import type { Result } from '@/lib/core';
import type { HealthMetric } from '@/lib/domain/health-data';

import type { GarminConnectionStatus, GarminSyncResult } from './types';

export interface GarminAdapter {
  getConnectionStatus(): Promise<Result<GarminConnectionStatus>>;
  connect(): Promise<Result<void>>;
  disconnect(): Promise<Result<void>>;
  syncLatestMetrics(userId: string): Promise<Result<GarminSyncResult>>;
  mapToHealthMetrics(userId: string): Promise<Result<HealthMetric[]>>;
}
