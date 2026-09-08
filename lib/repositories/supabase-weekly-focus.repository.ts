import type { Result } from '@/lib/core';
import type { WeeklyFocusAssignment } from '@/lib/domain/weekly-focus';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

import {
  mapWeeklyFocusInvalidRowError,
  mapWeeklyFocusReadError,
  mapWeeklyFocusRow,
  mapWeeklyFocusWriteError,
  requireWeeklyFocusLookup,
  weeklyFocusToInsert,
} from './weekly-focus-mappers';
import type {
  InsertWeeklyFocusAssignmentInput,
  WeeklyFocusRepository,
} from './weekly-focus.repository';

export class SupabaseWeeklyFocusRepository implements WeeklyFocusRepository {
  async getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyFocusAssignment | null>> {
    const lookupError = requireWeeklyFocusLookup(userId, weekStartDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_weekly_focus')
      .select('*')
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapWeeklyFocusReadError(error) };
    }

    if (!data) {
      return { ok: true, value: null };
    }

    const mapped = mapWeeklyFocusRow(data);
    if (!mapped) {
      return { ok: false, error: mapWeeklyFocusInvalidRowError() };
    }

    return { ok: true, value: mapped };
  }

  async insert(input: InsertWeeklyFocusAssignmentInput): Promise<Result<WeeklyFocusAssignment>> {
    const lookupError = requireWeeklyFocusLookup(input.userId, input.weekStartDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const payload = weeklyFocusToInsert(input);
    const { data, error } = await supabase
      .from('user_weekly_focus')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapWeeklyFocusWriteError(error) };
    }

    const mapped = mapWeeklyFocusRow(data);
    if (!mapped) {
      return { ok: false, error: mapWeeklyFocusInvalidRowError() };
    }

    return { ok: true, value: mapped };
  }
}

export const supabaseWeeklyFocusRepository = new SupabaseWeeklyFocusRepository();
