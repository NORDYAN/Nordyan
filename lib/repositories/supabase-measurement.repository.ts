import type { Result } from '@/lib/core';
import type { CreateMeasurementInput, Measurement } from '@/lib/domain/measurement';
import type { MeasurementRepository } from '@/lib/repositories/measurement.repository';
import {
  mapMeasurementError,
  mapMeasurementRow,
  measurementToInsert,
  missingSupabaseConfigError,
} from '@/lib/repositories/measurement-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

export class SupabaseMeasurementRepository implements MeasurementRepository {
  async create(input: CreateMeasurementInput): Promise<Result<Measurement>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const payload = measurementToInsert(input);
    const { data, error } = await supabase
      .from('measurements')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapMeasurementError(error) };
    }

    return { ok: true, value: mapMeasurementRow(data) };
  }
}

export const supabaseMeasurementRepository = new SupabaseMeasurementRepository();
