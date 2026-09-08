import type { AppError } from '@/lib/core';
import type { CreateMeasurementInput, Measurement } from '@/lib/domain/measurement';
import type { Database } from '@/lib/supabase/database.types';

import { missingSupabaseConfigError } from './profile-mappers';

type MeasurementRow = Database['public']['Tables']['measurements']['Row'];
type MeasurementInsert = Database['public']['Tables']['measurements']['Insert'];

export const MEASUREMENT_SAVE_ERROR_MESSAGE = 'Kunde inte spara mätningen. Försök igen.';

function toNumber(value: number | null): number {
  return value === null || Number.isNaN(Number(value)) ? Number.NaN : Number(value);
}

function toNullableHipCm(value: number | null): number | null {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function mapMeasurementRow(row: MeasurementRow): Measurement {
  return {
    id: row.id,
    userId: row.user_id,
    measuredAt: row.measured_at,
    weightKg: toNumber(row.weight_kg),
    waistCm: toNumber(row.waist_cm),
    neckCm: toNumber(row.neck_cm),
    hipCm: toNullableHipCm(row.hip_cm),
    createdAt: row.created_at,
  };
}

export function measurementToInsert(input: CreateMeasurementInput): MeasurementInsert {
  return {
    user_id: input.userId,
    measured_at: input.measuredAt,
    weight_kg: input.weightKg,
    waist_cm: input.waistCm,
    neck_cm: input.neckCm,
    hip_cm: input.hipCm,
  };
}

export function mapMeasurementError(
  error: { message?: string; code?: string } | null,
): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: MEASUREMENT_SAVE_ERROR_MESSAGE };
  }

  return {
    code: 'INTEGRATION',
    message: MEASUREMENT_SAVE_ERROR_MESSAGE,
    cause: error,
  };
}

export { missingSupabaseConfigError };
