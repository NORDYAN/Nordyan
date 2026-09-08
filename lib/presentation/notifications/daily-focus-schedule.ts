import { dailyFocusReminderCopy } from './notification-copy';
import {
  DAILY_FOCUS_NOTIFICATION_ID,
  type NotificationPreferences,
} from './notification-preferences';

export type DailyFocusNotificationPlan =
  | { action: 'cancel'; identifier: string }
  | {
      action: 'schedule';
      identifier: string;
      triggerType: 'daily';
      hour: number;
      minute: number;
      title: string;
      body: string;
      data: { type: 'daily-focus' };
    };

export function planDailyFocusNotification(
  prefs: NotificationPreferences,
): DailyFocusNotificationPlan {
  if (!prefs.dailyEnabled) {
    return { action: 'cancel', identifier: DAILY_FOCUS_NOTIFICATION_ID };
  }

  const copy = dailyFocusReminderCopy();
  return {
    action: 'schedule',
    identifier: DAILY_FOCUS_NOTIFICATION_ID,
    triggerType: 'daily',
    hour: prefs.dailyHour,
    minute: prefs.dailyMinute,
    title: copy.title,
    body: copy.body,
    data: { type: 'daily-focus' },
  };
}
