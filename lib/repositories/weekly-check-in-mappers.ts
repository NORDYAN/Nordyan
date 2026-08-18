import type { AppError } from '@/lib/core';
import {
  WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS,
  WEEKLY_CHECK_IN_SCALE_MAX,
  WEEKLY_CHECK_IN_SCALE_MIN,
  WEEKLY_CHECK_IN_TRAINING_FREQUENCIES,
  type WeeklyCheckIn,
  type WeeklyCheckInAlcoholConsumption,
  type WeeklyCheckInScale,
  type WeeklyCheckInTrainingFrequency,
} from '@/lib/domain/weekly-check-in';
import type { Database } from '@/lib/supabase/database.types';

import type { UpsertWeeklyCheckInInput } from './weekly-check-in.repository';

type WeeklyCheckInRow = Database['public']['Tables']['weekly_check_ins']['Row'];
type WeeklyCheckInInsert = Database['public']['Tables']['weekly_check_ins']['Insert'];

export const WEEKLY_CHECK_IN_READ_ERROR_MESSAGE = 'Kunde inte hämta veckokollen.';
export const WEEKLY_CHECK_IN_SAVE_ERROR_MESSAGE = 'Kunde inte spara veckokollen. Försök igen.';
export const WEEKLY_CHECK_IN_LOOKUP_ERROR_MESSAGE = 'userId och vecka krävs.';

function isWeeklyCheckInScale(value: number): value is WeeklyCheckInScale {
  return (
    Number.isInteger(value) &&
    value >= WEEKLY_CHECK_IN_SCALE_MIN &&
    value <= WEEKLY_CHECK_IN_SCALE_MAX
  );
}

function isTrainingFrequency(value: string): value is WeeklyCheckInTrainingFrequency {
  return (WEEKLY_CHECK_IN_TRAINING_FREQUENCIES as readonly string[]).includes(value);
}

function isAlcoholConsumption(value: string): value is WeeklyCheckInAlcoholConsumption {
  return (WEEKLY_CHECK_IN_ALCOHOL_CONSUMPTIONS as readonly string[]).includes(value);
}

export function requireWeeklyCheckInLookup(
  userId: string,
  weekStartDate: string,
): AppError | null {
  if (!userId.trim() || !weekStartDate.trim()) {
    return { code: 'VALIDATION', message: WEEKLY_CHECK_IN_LOOKUP_ERROR_MESSAGE };
  }

  return null;
}

export function mapWeeklyCheckInRow(row: WeeklyCheckInRow): WeeklyCheckIn | null {
  if (
    !isWeeklyCheckInScale(row.sleep_quality) ||
    !isWeeklyCheckInScale(row.energy) ||
    !isWeeklyCheckInScale(row.stress) ||
    !isWeeklyCheckInScale(row.everyday_activity) ||
    !isWeeklyCheckInScale(row.eating_quality) ||
    !isWeeklyCheckInScale(row.plan_adherence) ||
    !isTrainingFrequency(row.training_frequency) ||
    !isAlcoholConsumption(row.alcohol_consumption)
  ) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    sleepQuality: row.sleep_quality,
    energy: row.energy,
    stress: row.stress,
    trainingFrequency: row.training_frequency,
    everydayActivity: row.everyday_activity,
    eatingQuality: row.eating_quality,
    alcoholConsumption: row.alcohol_consumption,
    planAdherence: row.plan_adherence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function weeklyCheckInToUpsert(input: UpsertWeeklyCheckInInput): WeeklyCheckInInsert {
  return {
    user_id: input.userId,
    week_start_date: input.weekStartDate,
    sleep_quality: input.answers.sleepQuality,
    energy: input.answers.energy,
    stress: input.answers.stress,
    training_frequency: input.answers.trainingFrequency,
    everyday_activity: input.answers.everydayActivity,
    eating_quality: input.answers.eatingQuality,
    alcohol_consumption: input.answers.alcoholConsumption,
    plan_adherence: input.answers.planAdherence,
  };
}

function toSafeCause(error: { message?: string; code?: string } | null): { code: string } | undefined {
  return error?.code ? { code: error.code } : undefined;
}

export function mapWeeklyCheckInReadError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: WEEKLY_CHECK_IN_READ_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}

export function mapWeeklyCheckInWriteError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: WEEKLY_CHECK_IN_SAVE_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}
