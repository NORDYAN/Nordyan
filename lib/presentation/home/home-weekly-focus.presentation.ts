import type { Result } from '@/lib/core';

import type {
  HomeWeeklyFocusData,
  WeeklyFocusGetOrCreateValue,
} from '@/lib/services/weekly-focus';

export type HomeWeeklyFocusStatus =
  | { status: 'loading' }
  | { status: 'ready'; data: HomeWeeklyFocusData }
  | { status: 'unavailable' };

export function toHomeWeeklyFocusStatus(
  result: Result<WeeklyFocusGetOrCreateValue>,
): HomeWeeklyFocusStatus {
  if (!result.ok) {
    return { status: 'unavailable' };
  }

  if (result.value.status === 'ready') {
    return { status: 'ready', data: result.value.data };
  }

  if (result.value.status === 'not_ready') {
    return { status: 'loading' };
  }

  return { status: 'unavailable' };
}
