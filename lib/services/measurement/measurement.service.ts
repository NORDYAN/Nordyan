import type { AppError, Result } from '@/lib/core';
import type { Measurement } from '@/lib/domain/measurement';
import { mapMeasurementRow } from '@/lib/repositories/measurement-mappers';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

import {
  DEFAULT_MEASUREMENT_HISTORY_LIMIT,
  type MeasurementService,
} from './measurement.service.types';

function mapMeasurementHistoryError(
  error: { message?: string; code?: string } | null,
): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'Kunde inte hämta mätningar.' };
  }

  const message = error.message ?? '';
  const isMissingTable =
    error.code === 'PGRST205' ||
    message.includes('measurements') ||
    message.includes('schema cache');

  return {
    code: 'INTEGRATION',
    message: isMissingTable
      ? 'Tabellen measurements saknas i Supabase. Kör migrationen supabase/migrations/20260731100000_create_measurements.sql.'
      : message || 'Kunde inte hämta mätningar.',
    cause: error,
  };
}

class DefaultMeasurementService implements MeasurementService {
  async getMeasurementHistory(
    userId: string,
    limit: number = DEFAULT_MEASUREMENT_HISTORY_LIMIT,
  ): Promise<Result<Measurement[]>> {
    if (!userId.trim()) {
      return { ok: false, error: { code: 'VALIDATION', message: 'userId krävs.' } };
    }

    if (!Number.isInteger(limit) || limit <= 0) {
      return {
        ok: false,
        error: { code: 'VALIDATION', message: 'limit måste vara ett positivt heltal.' },
      };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('measurements')
      .select('*')
      .eq('user_id', userId)
      .order('measured_at', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false, error: mapMeasurementHistoryError(error) };
    }

    const measurements = (data ?? []).map(mapMeasurementRow);

    return { ok: true, value: measurements };
  }
}

export const measurementService = new DefaultMeasurementService();
