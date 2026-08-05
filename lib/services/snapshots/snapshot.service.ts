import type { AppError, Result } from '@/lib/core';
import type {
  CreateSnapshotInput,
  HealthSnapshot,
  SnapshotReason,
} from '@/lib/domain/snapshot';
import { missingSupabaseConfigError } from '@/lib/repositories/profile-mappers';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

import {
  DEFAULT_SNAPSHOT_HISTORY_LIMIT,
  type SnapshotService,
} from './snapshot.service.types';

type HealthSnapshotRow = Database['public']['Tables']['health_snapshots']['Row'];
type HealthSnapshotInsert = Database['public']['Tables']['health_snapshots']['Insert'];

const SNAPSHOT_REASONS: readonly SnapshotReason[] = [
  'onboarding',
  'profile_update',
  'weekly_checkin',
  'measurement',
];

function isSnapshotReason(value: string): value is SnapshotReason {
  return (SNAPSHOT_REASONS as readonly string[]).includes(value);
}

function toNumber(value: number | string): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapSnapshotRow(row: HealthSnapshotRow): HealthSnapshot | null {
  if (!isSnapshotReason(row.snapshot_reason)) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    createdAt: row.created_at,
    overallScore: row.overall_score,
    bmiScore: row.bmi_score,
    whtrScore: row.whtr_score,
    bodyFatScore: row.body_fat_score,
    activityScore: row.activity_score,
    primaryFocus: row.primary_focus,
    coachRecommendationId: row.coach_recommendation_id,
    weightKg: toNumber(row.weight_kg),
    waistCm: toNumber(row.waist_cm),
    neckCm: toNumber(row.neck_cm),
    engineVersion: row.engine_version,
    snapshotReason: row.snapshot_reason,
    bodyFatPct: row.body_fat_pct == null ? null : toNumber(row.body_fat_pct),
    coachDurationMinutes: row.coach_duration_minutes,
    coachFrequencyPerWeek: row.coach_frequency_per_week,
  };
}

function mapSnapshotError(error: { message?: string; code?: string } | null): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'Kunde inte hantera hälsosnapshot.' };
  }

  const message = error.message ?? '';
  const isMissingTable =
    error.code === 'PGRST205' ||
    message.includes('health_snapshots') ||
    message.includes('schema cache');

  return {
    code: 'INTEGRATION',
    message: isMissingTable
      ? 'Tabellen health_snapshots saknas i Supabase. Kör migrationen supabase/migrations/20260729100000_create_health_snapshots.sql.'
      : message || 'Kunde inte kommunicera med snapshot-tjänsten.',
    cause: error,
  };
}

function validateCreateSnapshotInput(input: CreateSnapshotInput): AppError | null {
  if (!input.userId.trim()) {
    return { code: 'VALIDATION', message: 'userId krävs för att skapa en snapshot.' };
  }

  const scoreFields: Array<[string, number]> = [
    ['overallScore', input.overallScore],
    ['bmiScore', input.bmiScore],
    ['whtrScore', input.whtrScore],
    ['bodyFatScore', input.bodyFatScore],
    ['activityScore', input.activityScore],
  ];

  for (const [name, value] of scoreFields) {
    if (!Number.isInteger(value) || value < 0 || value > 100) {
      return {
        code: 'VALIDATION',
        message: `${name} måste vara ett heltal mellan 0 och 100.`,
      };
    }
  }

  const measurementFields: Array<[string, number]> = [
    ['weightKg', input.weightKg],
    ['waistCm', input.waistCm],
    ['neckCm', input.neckCm],
  ];

  for (const [name, value] of measurementFields) {
    if (!Number.isFinite(value) || value <= 0) {
      return {
        code: 'VALIDATION',
        message: `${name} måste vara större än 0.`,
      };
    }
  }

  if (!input.primaryFocus.trim()) {
    return { code: 'VALIDATION', message: 'primaryFocus krävs.' };
  }

  if (!input.coachRecommendationId.trim()) {
    return { code: 'VALIDATION', message: 'coachRecommendationId krävs.' };
  }

  if (!input.engineVersion.trim()) {
    return { code: 'VALIDATION', message: 'engineVersion krävs.' };
  }

  if (!isSnapshotReason(input.snapshotReason)) {
    return { code: 'VALIDATION', message: 'snapshotReason är ogiltig.' };
  }

  return null;
}

function createSnapshotInsert(input: CreateSnapshotInput): HealthSnapshotInsert {
  return {
    user_id: input.userId,
    overall_score: input.overallScore,
    bmi_score: input.bmiScore,
    whtr_score: input.whtrScore,
    body_fat_score: input.bodyFatScore,
    activity_score: input.activityScore,
    primary_focus: input.primaryFocus,
    coach_recommendation_id: input.coachRecommendationId,
    weight_kg: input.weightKg,
    waist_cm: input.waistCm,
    neck_cm: input.neckCm,
    engine_version: input.engineVersion,
    snapshot_reason: input.snapshotReason,
    body_fat_pct: input.bodyFatPct ?? null,
    coach_duration_minutes: input.coachDurationMinutes ?? null,
    coach_frequency_per_week: input.coachFrequencyPerWeek ?? null,
  };
}

class DefaultSnapshotService implements SnapshotService {
  async createSnapshot(input: CreateSnapshotInput): Promise<Result<HealthSnapshot>> {
    const validationError = validateCreateSnapshotInput(input);
    if (validationError) {
      return { ok: false, error: validationError };
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      return { ok: false, error: missingSupabaseConfigError() };
    }

    const { data, error } = await supabase
      .from('health_snapshots')
      .insert(createSnapshotInsert(input))
      .select('*')
      .single();

    if (error) {
      return { ok: false, error: mapSnapshotError(error) };
    }

    const snapshot = mapSnapshotRow(data);
    if (!snapshot) {
      return {
        ok: false,
        error: {
          code: 'INTEGRATION',
          message: 'Snapshot returnerades i ett ogiltigt format.',
        },
      };
    }

    return { ok: true, value: snapshot };
  }

  async getLatestSnapshot(userId: string): Promise<Result<HealthSnapshot | null>> {
    const historyResult = await this.getSnapshotHistory(userId, 1);
    if (!historyResult.ok) {
      return historyResult;
    }

    return { ok: true, value: historyResult.value[0] ?? null };
  }

  async getSnapshotHistory(
    userId: string,
    limit: number = DEFAULT_SNAPSHOT_HISTORY_LIMIT,
  ): Promise<Result<HealthSnapshot[]>> {
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
      .from('health_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return { ok: false, error: mapSnapshotError(error) };
    }

    const snapshots: HealthSnapshot[] = [];

    for (const row of data ?? []) {
      const snapshot = mapSnapshotRow(row);
      if (!snapshot) {
        return {
          ok: false,
          error: {
            code: 'INTEGRATION',
            message: 'En eller flera snapshots returnerades i ett ogiltigt format.',
          },
        };
      }

      snapshots.push(snapshot);
    }

    return { ok: true, value: snapshots };
  }
}

export const snapshotService = new DefaultSnapshotService();
