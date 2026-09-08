import type { HomeWeeklyCheckInResolvedStatus } from '@/lib/presentation/home';

import { weeklyCheckInReminderCopy } from './notification-copy';
import {
  WEEKLY_CHECK_IN_NOTIFICATION_ID,
  WEEKLY_CHECK_IN_REMINDER_HOUR,
  WEEKLY_CHECK_IN_REMINDER_MINUTE,
} from './notification-preferences';

export type WeeklyCheckInNotificationPlan =
  | { action: 'cancel'; identifier: string }
  | {
      action: 'schedule';
      identifier: string;
      triggerType: 'date';
      date: Date;
      title: string;
      body: string;
      data: { type: 'weekly-check-in' };
    };

export function getThisWeekSundayAt(
  now: Date,
  hour: number,
  minute: number,
): Date {
  const weekday = now.getDay();
  const daysUntilSunday = weekday === 0 ? 0 : 7 - weekday;
  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + daysUntilSunday,
    hour,
    minute,
    0,
    0,
  );
}

export function getWeeklyCheckInReminderDate(now: Date): Date {
  const sunday = getThisWeekSundayAt(
    now,
    WEEKLY_CHECK_IN_REMINDER_HOUR,
    WEEKLY_CHECK_IN_REMINDER_MINUTE,
  );
  if (now.getTime() < sunday.getTime()) {
    return sunday;
  }

  return new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + 1,
    WEEKLY_CHECK_IN_REMINDER_HOUR,
    WEEKLY_CHECK_IN_REMINDER_MINUTE,
    0,
    0,
  );
}

export function planWeeklyCheckInNotification(input: {
  enabled: boolean;
  status: HomeWeeklyCheckInResolvedStatus;
  now: Date;
}): WeeklyCheckInNotificationPlan {
  if (!input.enabled || input.status.status !== 'available') {
    return { action: 'cancel', identifier: WEEKLY_CHECK_IN_NOTIFICATION_ID };
  }

  const copy = weeklyCheckInReminderCopy();
  return {
    action: 'schedule',
    identifier: WEEKLY_CHECK_IN_NOTIFICATION_ID,
    triggerType: 'date',
    date: getWeeklyCheckInReminderDate(input.now),
    title: copy.title,
    body: copy.body,
    data: { type: 'weekly-check-in' },
  };
}
