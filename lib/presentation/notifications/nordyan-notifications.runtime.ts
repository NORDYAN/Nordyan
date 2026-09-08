import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { reminderChannelName } from './notification-copy';
import {
  DAILY_FOCUS_NOTIFICATION_ID,
  NORDYAN_REMINDER_CHANNEL_ID,
  WEEKLY_CHECK_IN_NOTIFICATION_ID,
} from './notification-preferences';
import type { DailyFocusNotificationPlan } from './daily-focus-schedule';
import type { WeeklyCheckInNotificationPlan } from './weekly-check-in-schedule';
import { isNativeNotificationsSupported } from './notifications-platform';

let handlerReady = false;

export function ensureNotificationHandler(): void {
  if (!isNativeNotificationsSupported() || handlerReady) {
    return;
  }

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
  handlerReady = true;
}

export async function ensureReminderChannel(): Promise<void> {
  if (!isNativeNotificationsSupported() || Platform.OS !== 'android') {
    return;
  }

  await Notifications.setNotificationChannelAsync(NORDYAN_REMINDER_CHANNEL_ID, {
    name: reminderChannelName(),
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function cancelNordyanScheduledNotifications(): Promise<void> {
  if (!isNativeNotificationsSupported()) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_FOCUS_NOTIFICATION_ID);
  } catch {
    // Identifier may not exist.
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_CHECK_IN_NOTIFICATION_ID);
  } catch {
    // Identifier may not exist.
  }
}

export async function applyDailyFocusNotificationPlan(
  plan: DailyFocusNotificationPlan,
): Promise<void> {
  if (!isNativeNotificationsSupported()) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_FOCUS_NOTIFICATION_ID);
  } catch {
    // Ignore missing identifier.
  }

  if (plan.action === 'cancel') {
    return;
  }

  await ensureReminderChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: plan.identifier,
    content: {
      title: plan.title,
      body: plan.body,
      data: plan.data,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: plan.hour,
      minute: plan.minute,
      channelId: NORDYAN_REMINDER_CHANNEL_ID,
    },
  });
}

export async function applyWeeklyCheckInNotificationPlan(
  plan: WeeklyCheckInNotificationPlan,
): Promise<void> {
  if (!isNativeNotificationsSupported()) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(WEEKLY_CHECK_IN_NOTIFICATION_ID);
  } catch {
    // Ignore missing identifier.
  }

  if (plan.action === 'cancel') {
    return;
  }

  await ensureReminderChannel();
  await Notifications.scheduleNotificationAsync({
    identifier: plan.identifier,
    content: {
      title: plan.title,
      body: plan.body,
      data: plan.data,
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: plan.date,
      channelId: NORDYAN_REMINDER_CHANNEL_ID,
    },
  });
}
