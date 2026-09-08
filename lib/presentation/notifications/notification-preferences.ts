export type NotificationPreferences = {
  dailyEnabled: boolean;
  dailyHour: number;
  dailyMinute: number;
  weeklyEnabled: boolean;
};

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyEnabled: false,
  dailyHour: 8,
  dailyMinute: 0,
  weeklyEnabled: false,
};

export const DAILY_FOCUS_NOTIFICATION_ID = 'nordyan-daily-focus';
export const WEEKLY_CHECK_IN_NOTIFICATION_ID = 'nordyan-weekly-check-in';
export const NORDYAN_REMINDER_CHANNEL_ID = 'nordyan-reminders';
export const WEEKLY_CHECK_IN_REMINDER_HOUR = 18;
export const WEEKLY_CHECK_IN_REMINDER_MINUTE = 0;

export type NordyanReminderType = 'daily-focus' | 'weekly-check-in';

export function notificationPreferencesStorageKey(userId: string): string {
  return `@nordyan/notifications/user/${userId.trim()}`;
}

function isHour(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 23;
}

function isMinute(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 && value <= 59;
}

export function parseNotificationPreferences(raw: string | null | undefined): NotificationPreferences {
  if (!raw) {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { ...DEFAULT_NOTIFICATION_PREFERENCES };
    }

    const record = parsed as Record<string, unknown>;
    return {
      dailyEnabled: record.dailyEnabled === true,
      dailyHour: isHour(record.dailyHour)
        ? record.dailyHour
        : DEFAULT_NOTIFICATION_PREFERENCES.dailyHour,
      dailyMinute: isMinute(record.dailyMinute)
        ? record.dailyMinute
        : DEFAULT_NOTIFICATION_PREFERENCES.dailyMinute,
      weeklyEnabled: record.weeklyEnabled === true,
    };
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFERENCES };
  }
}

export function serializeNotificationPreferences(
  prefs: NotificationPreferences,
): string {
  return JSON.stringify({
    dailyEnabled: prefs.dailyEnabled,
    dailyHour: prefs.dailyHour,
    dailyMinute: prefs.dailyMinute,
    weeklyEnabled: prefs.weeklyEnabled,
  });
}

export function formatNotificationTime(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function notificationPreferenceFieldNames(): readonly (keyof NotificationPreferences)[] {
  return ['dailyEnabled', 'dailyHour', 'dailyMinute', 'weeklyEnabled'];
}
