import type { AppError } from '@/lib/core';
import {
  DAILY_FOCUS_INTENSITIES,
  DAILY_FOCUS_MODES,
  type DailyFocusHistoryEntry,
  type DailyFocusIntensity,
  type DailyFocusMode,
} from '@/lib/domain/daily-focus';
import { WEEKLY_FOCUS_AREAS, type WeeklyFocusArea } from '@/lib/domain/weekly-focus';
import type { Database } from '@/lib/supabase/database.types';

import type { InsertDailyFocusInput, PersistedDailyFocus } from './daily-focus.repository';

type DailyFocusRow = Database['public']['Tables']['user_daily_focus']['Row'];
type DailyFocusInsert = Database['public']['Tables']['user_daily_focus']['Insert'];

export const DAILY_FOCUS_READ_ERROR_MESSAGE = 'Kunde inte hämta dagens fokus.';
export const DAILY_FOCUS_SAVE_ERROR_MESSAGE = 'Kunde inte spara dagens fokus.';
export const DAILY_FOCUS_LOOKUP_ERROR_MESSAGE = 'userId och datum krävs.';
export const DAILY_FOCUS_INVALID_ROW_MESSAGE = 'Dagens fokus har ett ogiltigt format.';

export function requireDailyFocusLookup(userId: string, localDate: string): AppError | null {
  if (!userId.trim() || !localDate.trim()) {
    return { code: 'VALIDATION', message: DAILY_FOCUS_LOOKUP_ERROR_MESSAGE };
  }

  return null;
}

function isArea(value: string): value is WeeklyFocusArea {
  return (WEEKLY_FOCUS_AREAS as readonly string[]).includes(value);
}

function isMode(value: string): value is DailyFocusMode {
  return (DAILY_FOCUS_MODES as readonly string[]).includes(value);
}

function isIntensity(value: string): value is DailyFocusIntensity {
  return (DAILY_FOCUS_INTENSITIES as readonly string[]).includes(value);
}

function isSwapCount(value: number): value is 0 | 1 {
  return value === 0 || value === 1;
}

export function mapDailyFocusRow(row: DailyFocusRow): PersistedDailyFocus | null {
  if (!isArea(row.focus_area) || !isMode(row.weekly_mode) || !isIntensity(row.intensity)) {
    return null;
  }
  if (!isSwapCount(row.swap_count) || !row.action_id.trim() || !row.behavior_family.trim()) {
    return null;
  }

  const swappedFromFocusArea =
    row.swapped_from_focus_area == null
      ? null
      : isArea(row.swapped_from_focus_area)
        ? row.swapped_from_focus_area
        : null;
  const swappedFromIntensity =
    row.swapped_from_intensity == null
      ? null
      : isIntensity(row.swapped_from_intensity)
        ? row.swapped_from_intensity
        : null;

  if (row.swap_count === 1) {
    if (
      !row.swapped_from_action_id ||
      !row.swapped_from_behavior_family ||
      swappedFromFocusArea == null ||
      swappedFromIntensity == null
    ) {
      return null;
    }
  } else if (
    row.swapped_from_action_id != null ||
    row.swapped_from_behavior_family != null ||
    row.swapped_from_focus_area != null ||
    row.swapped_from_intensity != null
  ) {
    return null;
  }

  if (row.swap_count === 1 && (swappedFromFocusArea == null || swappedFromIntensity == null)) {
    return null;
  }

  return {
    id: row.id,
    userId: row.user_id,
    localDate: row.local_date,
    weekStartDate: row.week_start_date,
    actionId: row.action_id,
    focusArea: row.focus_area,
    weeklyMode: row.weekly_mode,
    intensity: row.intensity,
    behaviorFamily: row.behavior_family,
    completedAt: row.completed_at,
    swapCount: row.swap_count,
    swappedFromActionId: row.swapped_from_action_id,
    swappedFromBehaviorFamily: row.swapped_from_behavior_family,
    swappedFromFocusArea,
    swappedFromIntensity,
    actionBankVersion: row.action_bank_version,
    selectorVersion: row.selector_version,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function dailyFocusToInsert(input: InsertDailyFocusInput): DailyFocusInsert {
  return {
    user_id: input.userId,
    local_date: input.localDate,
    week_start_date: input.weekStartDate,
    action_id: input.actionId,
    focus_area: input.focusArea,
    weekly_mode: input.weeklyMode,
    intensity: input.intensity,
    behavior_family: input.behaviorFamily,
    action_bank_version: input.actionBankVersion,
    selector_version: input.selectorVersion,
  };
}

export function toDailyFocusHistoryEntry(row: PersistedDailyFocus): DailyFocusHistoryEntry {
  return {
    localDate: row.localDate,
    actionId: row.actionId,
    behaviorFamily: row.behaviorFamily,
    focusArea: row.focusArea,
    intensity: row.intensity,
    ...(row.swappedFromActionId
      ? {
          swappedFromActionId: row.swappedFromActionId,
          swappedFromBehaviorFamily: row.swappedFromBehaviorFamily ?? undefined,
          swappedFromFocusArea: row.swappedFromFocusArea ?? undefined,
          swappedFromIntensity: row.swappedFromIntensity ?? undefined,
        }
      : {}),
    completed: row.completedAt != null,
  };
}

function toSafeCause(error: { message?: string; code?: string } | null): { code: string } | undefined {
  return error?.code ? { code: error.code } : undefined;
}

export function isDailyFocusUniqueViolation(error: { code?: string; message?: string } | null): boolean {
  const code = error?.code?.toLowerCase() ?? '';
  const message = error?.message?.toLowerCase() ?? '';
  return code === '23505' || message.includes('duplicate') || message.includes('unique');
}

export function mapDailyFocusReadError(error: { message?: string; code?: string } | null): AppError {
  const cause = toSafeCause(error);
  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: DAILY_FOCUS_READ_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}

export function mapDailyFocusInvalidRowError(): AppError {
  return { code: 'INTEGRATION', message: DAILY_FOCUS_INVALID_ROW_MESSAGE };
}

export function mapDailyFocusWriteError(error: { message?: string; code?: string } | null): AppError {
  const cause = toSafeCause(error);
  if (isDailyFocusUniqueViolation(error)) {
    return {
      code: 'INTEGRATION',
      message: DAILY_FOCUS_SAVE_ERROR_MESSAGE,
      cause: { code: '23505' },
    };
  }

  return {
    code: error ? 'INTEGRATION' : 'UNKNOWN',
    message: DAILY_FOCUS_SAVE_ERROR_MESSAGE,
    ...(cause ? { cause } : {}),
  };
}
