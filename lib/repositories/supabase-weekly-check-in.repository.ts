import type { Result } from '@/lib/core';
import type { WeeklyCheckIn } from '@/lib/domain/weekly-check-in';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

import {
  mapWeeklyCheckInReadError,
  mapWeeklyCheckInRow,
  mapWeeklyCheckInWriteError,
  requireWeeklyCheckInLookup,
  weeklyCheckInToUpsert,
} from './weekly-check-in-mappers';
import type {
  UpsertWeeklyCheckInInput,
  WeeklyCheckInRepository,
} from './weekly-check-in.repository';

export class SupabaseWeeklyCheckInRepository implements WeeklyCheckInRepository {
  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyCheckIn | null>> {
    const lookupError = requireWeeklyCheckInLookup(userId, weekStartDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('weekly_check_ins')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapWeeklyCheckInReadError(error) };
    }

    if (!data) {
      return { ok: true, value: null };
    }

    const mapped = mapWeeklyCheckInRow(data);
    if (!mapped) {
      return { ok: false, error: mapWeeklyCheckInReadError(null) };
    }

    return { ok: true, value: mapped };
  }

  async upsertCurrentWeek(input: UpsertWeeklyCheckInInput): Promise<Result<WeeklyCheckIn>> {
    const lookupError = requireWeeklyCheckInLookup(input.userId, input.weekStartDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const payload = weeklyCheckInToUpsert(input);
    const { data, error } = await supabase
      .from('weekly_check_ins')
      .upsert(payload, { onConflict: 'user_id,week_start_date' })
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapWeeklyCheckInWriteError(error) };
    }

    const mapped = mapWeeklyCheckInRow(data);
    if (!mapped) {
      return { ok: false, error: mapWeeklyCheckInWriteError(null) };
    }

    return { ok: true, value: mapped };
  }
}

export const supabaseWeeklyCheckInRepository = new SupabaseWeeklyCheckInRepository();
