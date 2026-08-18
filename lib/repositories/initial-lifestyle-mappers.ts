import type { AppError } from '@/lib/core';
import {
  INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS,
  INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES,
  INITIAL_LIFESTYLE_SCALE_MAX,
  INITIAL_LIFESTYLE_SCALE_MIN,
  type InitialLifestyleAlcoholConsumption,
  type InitialLifestyleCheck,
  type InitialLifestyleLessHealthyFoodFrequency,
  type InitialLifestyleScale,
} from '@/lib/domain/initial-lifestyle';
import type { Database } from '@/lib/supabase/database.types';

import type { UpsertInitialLifestyleInput } from './initial-lifestyle.repository';

type InitialLifestyleRow = Database['public']['Tables']['initial_lifestyle_checks']['Row'];
type InitialLifestyleInsert = Database['public']['Tables']['initial_lifestyle_checks']['Insert'];

export const INITIAL_LIFESTYLE_READ_ERROR_MESSAGE = 'Kunde inte hämta livsstilskollen.';
export const INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE = 'Kunde inte spara livsstilskollen. Försök igen.';
export const INITIAL_LIFESTYLE_LOOKUP_ERROR_MESSAGE = 'userId krävs.';

function isInitialLifestyleScale(value: number): value is InitialLifestyleScale {
  return (
    Number.isInteger(value) &&
    value >= INITIAL_LIFESTYLE_SCALE_MIN &&
    value <= INITIAL_LIFESTYLE_SCALE_MAX
  );
}

function isLessHealthyFoodFrequency(
  value: string | null,
): value is InitialLifestyleLessHealthyFoodFrequency {
  return (
    value !== null &&
    (INITIAL_LIFESTYLE_LESS_HEALTHY_FOOD_FREQUENCIES as readonly string[]).includes(value)
  );
}

function isReadableLessHealthyFoodFrequency(
  value: string | null,
): value is InitialLifestyleLessHealthyFoodFrequency | null {
  return value === null || isLessHealthyFoodFrequency(value);
}

function isAlcoholConsumption(value: string): value is InitialLifestyleAlcoholConsumption {
  return (INITIAL_LIFESTYLE_ALCOHOL_CONSUMPTIONS as readonly string[]).includes(value);
}

export function requireInitialLifestyleLookup(userId: string): AppError | null {
  if (!userId.trim()) {
    return { code: 'VALIDATION', message: INITIAL_LIFESTYLE_LOOKUP_ERROR_MESSAGE };
  }

  return null;
}

export function mapInitialLifestyleRow(row: InitialLifestyleRow): InitialLifestyleCheck | null {
  if (
    !isInitialLifestyleScale(row.sleep_quality) ||
    !isInitialLifestyleScale(row.energy) ||
    !isInitialLifestyleScale(row.stress) ||
    !isInitialLifestyleScale(row.everyday_activity) ||
    !isInitialLifestyleScale(row.eating_quality) ||
    !isReadableLessHealthyFoodFrequency(row.less_healthy_food_frequency) ||
    !isAlcoholConsumption(row.alcohol_consumption)
  ) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    sleepQuality: row.sleep_quality,
    energy: row.energy,
    stress: row.stress,
    lessHealthyFoodFrequency: row.less_healthy_food_frequency,
    everydayActivity: row.everyday_activity,
    eatingQuality: row.eating_quality,
    alcoholConsumption: row.alcohol_consumption,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function initialLifestyleToUpsert(
  input: UpsertInitialLifestyleInput,
): InitialLifestyleInsert {
  return {
    user_id: input.userId,
    sleep_quality: input.answers.sleepQuality,
    energy: input.answers.energy,
    stress: input.answers.stress,
    less_healthy_food_frequency: input.answers.lessHealthyFoodFrequency,
    everyday_activity: input.answers.everydayActivity,
    eating_quality: input.answers.eatingQuality,
    alcohol_consumption: input.answers.alcoholConsumption,
  };
}

function toSafeCause(error: { message?: string; code?: string } | null): { code: string } | undefined {
  return error?.code ? { code: error.code } : undefined;
}

export function mapInitialLifestyleReadError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: INITIAL_LIFESTYLE_READ_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}

export function mapInitialLifestyleWriteError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: INITIAL_LIFESTYLE_SAVE_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}
