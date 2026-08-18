import { routes } from '@/constants/routes';
import type { Result } from '@/lib/core';
import {
  getWeeklyCheckInWeekStartDate,
  isWeeklyCheckInLocalCalendarDate,
} from '@/lib/domain/weekly-check-in';
import { liveCopy, t } from '@/lib/i18n';
import type { InitialLifestyleService } from '@/lib/services/initial-lifestyle';
import type {
  WeeklyCheckInCurrentWeek,
  WeeklyCheckInService,
} from '@/lib/services/weekly-check-in';

import type {
  HomeWeeklyCheckInResolvedStatus,
  HomeWeeklyCheckInStatus,
} from './home-weekly-check-in.types';

export const HOME_WEEKLY_CHECK_IN_COPY = liveCopy({
  title: () => t('home.weeklyCheckIn.title'),
  supporting: () => t('home.weeklyCheckIn.supporting'),
  explanation: () => t('home.weeklyCheckIn.explanation'),
  timeHint: () => t('home.weeklyCheckIn.timeHint'),
  cta: () => t('home.weeklyCheckIn.cta'),
});

export const HOME_WEEKLY_CHECK_IN_ROUTE = routes.weeklyCheckIn;

export type ResolveHomeWeeklyCheckInStatusInput = {
  weeklyCheckIn: Pick<WeeklyCheckInService, 'getCurrentWeek'>;
  initialLifestyle: Pick<InitialLifestyleService, 'get'>;
  userId: string | null | undefined;
  localDate?: string;
};

export function toHomeWeeklyCheckInStatus(
  result: Result<WeeklyCheckInCurrentWeek>,
): HomeWeeklyCheckInResolvedStatus {
  if (!result.ok) {
    return { status: 'unavailable' };
  }

  if (result.value.status === 'empty') {
    return {
      status: 'available',
      weekStartDate: result.value.weekStartDate,
    };
  }

  return {
    status: 'completed',
    weekStartDate: result.value.weekStartDate,
  };
}

export function toLocalCalendarDateFromTimestamp(value: string): string | null {
  const trimmed = value.trim();
  if (isWeeklyCheckInLocalCalendarDate(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Home-only: whether Initial Lifestyle created_at falls in the current local Monday week.
 * Returns null when the timestamp cannot be resolved — callers must fail closed.
 */
export function isInitialLifestyleCreatedInCurrentLocalWeek(
  createdAt: string,
  currentWeekStartDate: string,
): boolean | null {
  const localDate = toLocalCalendarDateFromTimestamp(createdAt);
  if (!localDate || !isWeeklyCheckInLocalCalendarDate(currentWeekStartDate)) {
    return null;
  }

  try {
    return getWeeklyCheckInWeekStartDate(localDate) === currentWeekStartDate;
  } catch {
    return null;
  }
}

export function applyHomeWeeklyCheckInLifestyleSuppression(
  weeklyStatus: HomeWeeklyCheckInResolvedStatus,
  initialLifestyleCreatedAt: string | null | undefined,
): HomeWeeklyCheckInResolvedStatus {
  if (weeklyStatus.status !== 'available') {
    return weeklyStatus;
  }

  if (!initialLifestyleCreatedAt) {
    return weeklyStatus;
  }

  const sameWeek = isInitialLifestyleCreatedInCurrentLocalWeek(
    initialLifestyleCreatedAt,
    weeklyStatus.weekStartDate,
  );

  if (sameWeek !== false) {
    return { status: 'suppressed', weekStartDate: weeklyStatus.weekStartDate };
  }

  return weeklyStatus;
}

export function shouldShowHomeWeeklyCheckInCard(state: HomeWeeklyCheckInStatus): boolean {
  return state.status === 'available';
}

export async function resolveHomeWeeklyCheckInStatus(
  input: ResolveHomeWeeklyCheckInStatusInput,
): Promise<HomeWeeklyCheckInResolvedStatus> {
  const userId = input.userId?.trim();
  if (!userId) {
    return { status: 'unavailable' };
  }

  const [weekResult, lifestyleResult] = await Promise.all([
    input.weeklyCheckIn.getCurrentWeek(userId, input.localDate),
    input.initialLifestyle.get(userId),
  ]);

  const weekly = toHomeWeeklyCheckInStatus(weekResult);
  if (weekly.status === 'completed') {
    return weekly;
  }

  if (weekly.status === 'unavailable') {
    return weekly;
  }

  if (!lifestyleResult.ok) {
    return { status: 'unavailable' };
  }

  return applyHomeWeeklyCheckInLifestyleSuppression(
    weekly,
    lifestyleResult.value?.createdAt,
  );
}
