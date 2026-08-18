import type { Result } from '@/lib/core';
import type { InitialLifestyleCheck } from '@/lib/domain/initial-lifestyle';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

import {
  initialLifestyleToUpsert,
  mapInitialLifestyleReadError,
  mapInitialLifestyleRow,
  mapInitialLifestyleWriteError,
  requireInitialLifestyleLookup,
} from './initial-lifestyle-mappers';
import type {
  InitialLifestyleRepository,
  UpsertInitialLifestyleInput,
} from './initial-lifestyle.repository';

export class SupabaseInitialLifestyleRepository implements InitialLifestyleRepository {
  async getByUser(userId: string): Promise<Result<InitialLifestyleCheck | null>> {
    const lookupError = requireInitialLifestyleLookup(userId);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('initial_lifestyle_checks')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapInitialLifestyleReadError(error) };
    }

    if (!data) {
      return { ok: true, value: null };
    }

    const mapped = mapInitialLifestyleRow(data);
    if (!mapped) {
      return { ok: false, error: mapInitialLifestyleReadError(null) };
    }

    return { ok: true, value: mapped };
  }

  async upsert(input: UpsertInitialLifestyleInput): Promise<Result<InitialLifestyleCheck>> {
    const lookupError = requireInitialLifestyleLookup(input.userId);
    if (lookupError) {
      return { ok: false, error: lookupError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const payload = initialLifestyleToUpsert(input);
    const { data, error } = await supabase
      .from('initial_lifestyle_checks')
      .upsert(payload, { onConflict: 'user_id' })
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapInitialLifestyleWriteError(error) };
    }

    const mapped = mapInitialLifestyleRow(data);
    if (!mapped) {
      return { ok: false, error: mapInitialLifestyleWriteError(null) };
    }

    return { ok: true, value: mapped };
  }
}

export const supabaseInitialLifestyleRepository = new SupabaseInitialLifestyleRepository();
