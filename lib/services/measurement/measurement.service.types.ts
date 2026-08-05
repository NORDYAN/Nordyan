import type { Result } from '@/lib/core';
import type { Measurement } from '@/lib/domain/measurement';

export const DEFAULT_MEASUREMENT_HISTORY_LIMIT = 50;

export interface MeasurementService {
  getMeasurementHistory(userId: string, limit?: number): Promise<Result<Measurement[]>>;
}
