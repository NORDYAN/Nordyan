import type { AppError } from '@/lib/core';
import {
  WEEKLY_FOCUS_AREAS,
  type WeeklyFocusArea,
  type WeeklyFocusAssignment,
  type WeeklyFocusMode,
  type WeeklyFocusNeedScore,
  type WeeklyFocusSelectedArea,
} from '@/lib/domain/weekly-focus';
import type { Database } from '@/lib/supabase/database.types';

import type { InsertWeeklyFocusAssignmentInput } from './weekly-focus.repository';

type WeeklyFocusRow = Database['public']['Tables']['user_weekly_focus']['Row'];
type WeeklyFocusInsert = Database['public']['Tables']['user_weekly_focus']['Insert'];

export const WEEKLY_FOCUS_READ_ERROR_MESSAGE = 'Kunde inte hämta veckans fokus.';
export const WEEKLY_FOCUS_SAVE_ERROR_MESSAGE = 'Kunde inte spara veckans fokus.';
export const WEEKLY_FOCUS_LOOKUP_ERROR_MESSAGE = 'userId och vecka krävs.';
export const WEEKLY_FOCUS_INVALID_ROW_MESSAGE = 'Veckans fokus har ett ogiltigt format.';

const MODES: readonly WeeklyFocusMode[] = ['improve', 'maintain'];

export function requireWeeklyFocusLookup(userId: string, weekStartDate: string): AppError | null {
  if (!userId.trim() || !weekStartDate.trim()) {
    return { code: 'VALIDATION', message: WEEKLY_FOCUS_LOOKUP_ERROR_MESSAGE };
  }

  return null;
}

function isArea(value: string): value is WeeklyFocusArea {
  return (WEEKLY_FOCUS_AREAS as readonly string[]).includes(value);
}

function isMode(value: string): value is WeeklyFocusMode {
  return (MODES as readonly string[]).includes(value);
}

function isNeed(value: number): value is WeeklyFocusNeedScore {
  return Number.isInteger(value) && value >= 0 && value <= 5;
}

function mapSelectedArea(area: string, mode: string, need: number): WeeklyFocusSelectedArea | null {
  if (!isArea(area) || !isMode(mode) || !isNeed(need)) {
    return null;
  }

  return { area, mode, needScore: need };
}

export function mapWeeklyFocusRow(row: WeeklyFocusRow): WeeklyFocusAssignment | null {
  const first = mapSelectedArea(row.area_1, row.area_1_mode, row.area_1_need);
  const second = mapSelectedArea(row.area_2, row.area_2_mode, row.area_2_need);
  if (!first || !second) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    weekStartDate: row.week_start_date,
    focuses: [first, second],
    recoveryConstraint: row.recovery_constraint,
    engineVersion: row.engine_version,
    insufficientEvidenceFallback: row.insufficient_evidence_fallback,
    createdAt: row.created_at,
  };
}

export function weeklyFocusToInsert(input: InsertWeeklyFocusAssignmentInput): WeeklyFocusInsert {
  const [first, second] = input.focuses;
  return {
    user_id: input.userId,
    week_start_date: input.weekStartDate,
    area_1: first.area,
    area_1_mode: first.mode,
    area_1_need: first.needScore,
    area_2: second.area,
    area_2_mode: second.mode,
    area_2_need: second.needScore,
    recovery_constraint: input.recoveryConstraint,
    engine_version: input.engineVersion,
    insufficient_evidence_fallback: input.insufficientEvidenceFallback,
  };
}

function toSafeCause(error: { message?: string; code?: string } | null): { code: string } | undefined {
  return error?.code ? { code: error.code } : undefined;
}

export function isWeeklyFocusUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  const code = error?.code?.toLowerCase() ?? '';
  const message = error?.message?.toLowerCase() ?? '';
  return code === '23505' || message.includes('duplicate') || message.includes('unique');
}

export function mapWeeklyFocusReadError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: WEEKLY_FOCUS_READ_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}

export function mapWeeklyFocusInvalidRowError(): AppError {
  return { code: 'INTEGRATION', message: WEEKLY_FOCUS_INVALID_ROW_MESSAGE };
}

export function mapWeeklyFocusWriteError(
  error: { message?: string; code?: string } | null,
): AppError {
  const cause = toSafeCause(error);
  if (isWeeklyFocusUniqueViolation(error)) {
    return {
      code: 'INTEGRATION',
      message: WEEKLY_FOCUS_SAVE_ERROR_MESSAGE,
      cause: { code: '23505' },
    };
  }

  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: WEEKLY_FOCUS_SAVE_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}
