import type { AppError } from '@/lib/core';
import type {
  ProfileActivityLevel,
  ProfileGender,
  ProfileGoal,
  ProfileMeasurements,
  UserProfile,
} from '@/lib/domain/profile';
import type { Database } from '@/lib/supabase/database.types';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

const PROFILE_GENDERS: readonly ProfileGender[] = ['male', 'female', 'other'];
const PROFILE_ACTIVITY_LEVELS: readonly ProfileActivityLevel[] = [
  'sedentary',
  'lightly_active',
  'moderately_active',
  'very_active',
  'extra_active',
];
const PROFILE_GOALS: readonly ProfileGoal[] = [
  'lose_weight',
  'maintain',
  'gain_muscle',
  'improve_health',
];

function isProfileGender(value: string | null): value is ProfileGender {
  return value !== null && (PROFILE_GENDERS as readonly string[]).includes(value);
}

function isProfileActivityLevel(value: string | null): value is ProfileActivityLevel {
  return value !== null && (PROFILE_ACTIVITY_LEVELS as readonly string[]).includes(value);
}

function isProfileGoal(value: string | null): value is ProfileGoal {
  return value !== null && (PROFILE_GOALS as readonly string[]).includes(value);
}

function toNumber(value: number | null): number | null {
  return value === null || Number.isNaN(Number(value)) ? null : Number(value);
}

export function mapProfileRow(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    userId: row.user_id,
    firstName: row.first_name,
    dateOfBirth: row.date_of_birth,
    gender: isProfileGender(row.gender) ? row.gender : null,
    heightCm: toNumber(row.height_cm),
    weightKg: toNumber(row.weight_kg),
    waistCm: toNumber(row.waist_cm),
    neckCm: toNumber(row.neck_cm),
    activityLevel: isProfileActivityLevel(row.activity_level) ? row.activity_level : null,
    goal: isProfileGoal(row.goal) ? row.goal : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dateOfBirthFromAge(age: number): string {
  const year = new Date().getFullYear() - Math.max(0, Math.floor(age));
  return `${year}-01-01`;
}

export function resolveDateOfBirth(measurements: ProfileMeasurements): string | null {
  if (measurements.dateOfBirth) {
    return measurements.dateOfBirth;
  }

  if (typeof measurements.age === 'number' && Number.isFinite(measurements.age)) {
    return dateOfBirthFromAge(measurements.age);
  }

  return null;
}

export function measurementsToInsert(
  userId: string,
  measurements: ProfileMeasurements,
): ProfileInsert {
  return {
    user_id: userId,
    first_name: measurements.firstName ?? null,
    date_of_birth: resolveDateOfBirth(measurements),
    gender: measurements.gender ?? null,
    height_cm: measurements.heightCm,
    weight_kg: measurements.weightKg ?? null,
    waist_cm: measurements.waistCm ?? null,
    neck_cm: measurements.neckCm ?? null,
    activity_level: measurements.activityLevel ?? null,
    goal: measurements.goal ?? null,
  };
}

export function profilePatchToUpdate(patch: Partial<UserProfile>): ProfileUpdate {
  const update: ProfileUpdate = {};

  if ('firstName' in patch) {
    update.first_name = patch.firstName ?? null;
  }
  if ('dateOfBirth' in patch) {
    update.date_of_birth = patch.dateOfBirth ?? null;
  }
  if ('gender' in patch) {
    update.gender = patch.gender ?? null;
  }
  if ('heightCm' in patch) {
    update.height_cm = patch.heightCm ?? null;
  }
  if ('weightKg' in patch) {
    update.weight_kg = patch.weightKg ?? null;
  }
  if ('waistCm' in patch) {
    update.waist_cm = patch.waistCm ?? null;
  }
  if ('neckCm' in patch) {
    update.neck_cm = patch.neckCm ?? null;
  }
  if ('activityLevel' in patch) {
    update.activity_level = patch.activityLevel ?? null;
  }
  if ('goal' in patch) {
    update.goal = patch.goal ?? null;
  }

  return update;
}

export function mapProfileError(error: { message?: string; code?: string } | null): AppError {
  if (!error) {
    return { code: 'UNKNOWN', message: 'Kunde inte spara profilen. Försök igen.' };
  }

  if (error.code === 'PGRST116') {
    return { code: 'NOT_FOUND', message: 'Profilen hittades inte.' };
  }

  return {
    code: 'INTEGRATION',
    message: error.message || 'Kunde inte kommunicera med profiltjänsten.',
    cause: error,
  };
}

export function missingSupabaseConfigError(): AppError {
  return {
    code: 'INTEGRATION',
    message: 'Supabase är inte konfigurerat. Lägg till EXPO_PUBLIC_SUPABASE_URL och nyckel.',
  };
}
