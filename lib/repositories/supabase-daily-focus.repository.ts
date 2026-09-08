import type { Result } from '@/lib/core';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

import {
  dailyFocusToInsert,
  mapDailyFocusInvalidRowError,
  mapDailyFocusReadError,
  mapDailyFocusRow,
  mapDailyFocusWriteError,
  requireDailyFocusLookup,
} from './daily-focus-mappers';
import type {
  DailyFocusRepository,
  InsertDailyFocusInput,
  PersistedDailyFocus,
  SwapDailyFocusInput,
} from './daily-focus.repository';

function mapRowResult(data: Parameters<typeof mapDailyFocusRow>[0] | null): Result<PersistedDailyFocus> {
  if (!data) {
    return { ok: false, error: mapDailyFocusInvalidRowError() };
  }
  const mapped = mapDailyFocusRow(data);
  if (!mapped) {
    return { ok: false, error: mapDailyFocusInvalidRowError() };
  }
  return { ok: true, value: mapped };
}

export class SupabaseDailyFocusRepository implements DailyFocusRepository {
  async getByUserAndDate(
    userId: string,
    localDate: string,
  ): Promise<Result<PersistedDailyFocus | null>> {
    const lookupError = requireDailyFocusLookup(userId, localDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .select('*')
      .eq('user_id', userId)
      .eq('local_date', localDate)
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapDailyFocusReadError(error) };
    }
    if (!data) {
      return { ok: true, value: null };
    }

    const mapped = mapDailyFocusRow(data);
    if (!mapped) {
      return { ok: false, error: mapDailyFocusInvalidRowError() };
    }
    return { ok: true, value: mapped };
  }

  async getHistoryRange(
    userId: string,
    fromLocalDateInclusive: string,
    toLocalDateExclusive: string,
  ): Promise<Result<PersistedDailyFocus[]>> {
    const lookupError = requireDailyFocusLookup(userId, fromLocalDateInclusive);
    if (lookupError || !toLocalDateExclusive.trim()) {
      return { ok: false, error: lookupError ?? { code: 'VALIDATION', message: 'Ogiltigt datumintervall.' } };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .select('*')
      .eq('user_id', userId)
      .gte('local_date', fromLocalDateInclusive)
      .lt('local_date', toLocalDateExclusive)
      .order('local_date', { ascending: true });

    if (error) {
      return { ok: false, error: mapDailyFocusReadError(error) };
    }

    const rows: PersistedDailyFocus[] = [];
    for (const row of data ?? []) {
      const mapped = mapDailyFocusRow(row);
      if (!mapped) {
        return { ok: false, error: mapDailyFocusInvalidRowError() };
      }
      rows.push(mapped);
    }
    return { ok: true, value: rows };
  }

  async insert(input: InsertDailyFocusInput): Promise<Result<PersistedDailyFocus>> {
    const lookupError = requireDailyFocusLookup(input.userId, input.localDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .insert(dailyFocusToInsert(input))
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapDailyFocusWriteError(error) };
    }
    return mapRowResult(data);
  }

  async swapIfAvailable(input: SwapDailyFocusInput): Promise<Result<PersistedDailyFocus | null>> {
    const lookupError = requireDailyFocusLookup(input.userId, input.localDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .update({
        action_id: input.replacement.actionId,
        focus_area: input.replacement.focusArea,
        weekly_mode: input.replacement.weeklyMode,
        intensity: input.replacement.intensity,
        behavior_family: input.replacement.behaviorFamily,
        swapped_from_action_id: input.originalSnapshot.actionId,
        swapped_from_behavior_family: input.originalSnapshot.behaviorFamily,
        swapped_from_focus_area: input.originalSnapshot.focusArea,
        swapped_from_intensity: input.originalSnapshot.intensity,
        swap_count: 1,
      })
      .eq('user_id', input.userId)
      .eq('local_date', input.localDate)
      .eq('swap_count', 0)
      .eq('action_id', input.expectedCurrentActionId)
      .is('completed_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapDailyFocusWriteError(error) };
    }
    if (!data) {
      return { ok: true, value: null };
    }
    return mapRowResult(data);
  }

  async markComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>> {
    const lookupError = requireDailyFocusLookup(userId, localDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .update({ completed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('local_date', localDate)
      .is('completed_at', null)
      .select('*')
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapDailyFocusWriteError(error) };
    }
    if (!data) {
      return { ok: true, value: null };
    }
    return mapRowResult(data);
  }

  async undoComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>> {
    const lookupError = requireDailyFocusLookup(userId, localDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('user_daily_focus')
      .update({ completed_at: null })
      .eq('user_id', userId)
      .eq('local_date', localDate)
      .not('completed_at', 'is', null)
      .select('*')
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapDailyFocusWriteError(error) };
    }
    if (!data) {
      return { ok: true, value: null };
    }
    return mapRowResult(data);
  }

  async countCompletedByWeek(userId: string, weekStartDate: string): Promise<Result<number>> {
    const lookupError = requireDailyFocusLookup(userId, weekStartDate);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { count, error } = await supabase
      .from('user_daily_focus')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('week_start_date', weekStartDate)
      .not('completed_at', 'is', null);

    if (error) {
      return { ok: false, error: mapDailyFocusReadError(error) };
    }
    return { ok: true, value: count ?? 0 };
  }
}

export const supabaseDailyFocusRepository = new SupabaseDailyFocusRepository();
