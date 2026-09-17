import type { NotificationPreferences } from '@/lib/presentation/notifications/notification-preferences';

export const PENDING_NOTIFICATION_CHOICE_KEY = '@nordyan/pending_notification_choice';

export type PendingNotificationChoice = 'enabled' | 'skipped';

export const ONBOARDING_DAILY_REMINDER_HOURS = [7, 8, 9, 16, 17, 18] as const;
export type OnboardingDailyReminderHour = (typeof ONBOARDING_DAILY_REMINDER_HOURS)[number];
export const DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR = 8;
export const ONBOARDING_DAILY_REMINDER_HOUR_ROWS = [
  [7, 8, 9],
  [16, 17, 18],
] as const satisfies ReadonlyArray<readonly OnboardingDailyReminderHour[]>;

export type PendingNotificationIntent =
  | { choice: 'skipped' }
  | { choice: 'enabled'; dailyHour: OnboardingDailyReminderHour };

type PendingNotificationChoiceRecord = {
  version: 1;
  choice: PendingNotificationChoice;
  dailyHour?: unknown;
};

export function isOnboardingDailyReminderHour(
  value: unknown,
): value is OnboardingDailyReminderHour {
  return value === 7 || value === 8 || value === 9 || value === 16 || value === 17 || value === 18;
}

export function resolveOnboardingDailyReminderHour(
  value: unknown,
): OnboardingDailyReminderHour {
  return isOnboardingDailyReminderHour(value) ? value : DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR;
}

export function formatOnboardingDailyReminderHour(hour: OnboardingDailyReminderHour): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function onboardingEnabledNotificationPreferences(
  dailyHour: OnboardingDailyReminderHour = DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR,
): NotificationPreferences {
  return {
    dailyEnabled: true,
    weeklyEnabled: true,
    dailyHour,
    dailyMinute: 0,
  };
}

export const ONBOARDING_ENABLED_NOTIFICATION_PREFERENCES =
  onboardingEnabledNotificationPreferences(DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR);

export function parsePendingNotificationChoice(
  raw: string | null | undefined,
): PendingNotificationIntent | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }

    const record = parsed as Partial<PendingNotificationChoiceRecord>;
    if (record.version !== 1) {
      return null;
    }
    if (record.choice === 'skipped') {
      return { choice: 'skipped' };
    }
    if (record.choice === 'enabled') {
      return {
        choice: 'enabled',
        dailyHour: resolveOnboardingDailyReminderHour(record.dailyHour),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function serializePendingNotificationChoice(intent: PendingNotificationIntent): string {
  const record: PendingNotificationChoiceRecord =
    intent.choice === 'enabled'
      ? {
          version: 1,
          choice: 'enabled',
          dailyHour: intent.dailyHour,
        }
      : {
          version: 1,
          choice: 'skipped',
        };
  return JSON.stringify(record);
}
