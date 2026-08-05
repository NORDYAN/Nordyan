import type { Result } from '@/lib/core';
import type { CreateMeasurementInput, Measurement } from '@/lib/domain/measurement';

export interface MeasurementRepository {
  create(input: CreateMeasurementInput): Promise<Result<Measurement>>;
}
