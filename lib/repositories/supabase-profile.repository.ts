import type { Result } from '@/lib/core';
import type { ProfileMeasurements, UserProfile } from '@/lib/domain/profile';
import type { ProfileRepository } from '@/lib/repositories/profile.repository';
import {
  mapProfileError,
  mapProfileRow,
  measurementsToInsert,
  missingSupabaseConfigError,
  profilePatchToUpdate,
} from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';

export class SupabaseProfileRepository implements ProfileRepository {
  async getByUserId(userId: string): Promise<Result<UserProfile | null>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: mapProfileError(error) };
    }

    return { ok: true, value: data ? mapProfileRow(data) : null };
  }

  async createFromMeasurements(
    userId: string,
    measurements: ProfileMeasurements,
  ): Promise<Result<UserProfile>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const payload = measurementsToInsert(userId, measurements);
    const { data, error } = await supabase.from('profiles').insert(payload).select('*').single();

    if (error) {
      return { ok: false, error: mapProfileError(error) };
    }

    return { ok: true, value: mapProfileRow(data) };
  }

  async update(userId: string, patch: Partial<UserProfile>): Promise<Result<UserProfile>> {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const update = profilePatchToUpdate(patch);
    const { data, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapProfileError(error) };
    }

    return { ok: true, value: mapProfileRow(data) };
  }
}

export const supabaseProfileRepository = new SupabaseProfileRepository();
