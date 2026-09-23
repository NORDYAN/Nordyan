import { resolveHomeWeeklyCheckInStatus } from '@/lib/presentation/home';
import { initialLifestyleService } from '@/lib/services/initial-lifestyle';
import { measurementService } from '@/lib/services/measurement';
import { weeklyCheckInService } from '@/lib/services/weekly-check-in';

import { planDailyFocusNotification } from './daily-focus-schedule';
import { weeklyMeasurementDueFromHistoryResult } from './notification-measurement-due';
import {
  applyDailyFocusNotificationPlan,
  applyWeeklyCheckInNotificationPlan,
  cancelNordyanScheduledNotifications,
  ensureNotificationHandler,
  ensureReminderChannel,
} from './nordyan-notifications.runtime';
import { notificationPreferencesStore } from './notification-preferences.storage';
import { isNativeNotificationsSupported } from './notifications-platform';
import { planWeeklyCheckInNotification } from './weekly-check-in-schedule';

async function resolveWeeklyCheckInMeasurementDue(userId: string): Promise<boolean> {
  try {
    const result = await measurementService.getMeasurementHistory(userId, 1);
    return weeklyMeasurementDueFromHistoryResult(result);
  } catch {
    return false;
  }
}

export async function restoreNordyanNotificationSchedules(userId: string): Promise<void> {
  if (!isNativeNotificationsSupported() || !userId.trim()) {
    return;
  }

  ensureNotificationHandler();
  await ensureReminderChannel();
  const prefs = await notificationPreferencesStore.get(userId);
  await applyDailyFocusNotificationPlan(planDailyFocusNotification(prefs));
  await syncWeeklyCheckInReminderForUser(userId, prefs.weeklyEnabled);
}

export async function syncWeeklyCheckInReminderForUser(
  userId: string,
  weeklyEnabled?: boolean,
): Promise<void> {
  if (!isNativeNotificationsSupported() || !userId.trim()) {
    return;
  }

  const enabled =
    weeklyEnabled ?? (await notificationPreferencesStore.get(userId)).weeklyEnabled;
  if (!enabled) {
    await applyWeeklyCheckInNotificationPlan(
      planWeeklyCheckInNotification({
        enabled: false,
        status: { status: 'unavailable' },
        now: new Date(),
      }),
    );
    return;
  }

  const status = await resolveHomeWeeklyCheckInStatus({
    weeklyCheckIn: weeklyCheckInService,
    initialLifestyle: initialLifestyleService,
    userId,
  });

  const measurementDue =
    status.status === 'available' ? await resolveWeeklyCheckInMeasurementDue(userId) : false;

  await applyWeeklyCheckInNotificationPlan(
    planWeeklyCheckInNotification({
      enabled: true,
      status,
      now: new Date(),
      measurementDue,
    }),
  );
}

export { cancelNordyanScheduledNotifications };
