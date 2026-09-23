import { t } from '@/lib/i18n';

export function dailyFocusReminderCopy(): { title: string; body: string } {
  return {
    title: t('profile.notifications.daily.title'),
    body: t('profile.notifications.daily.body'),
  };
}

export function weeklyCheckInReminderCopy(input?: {
  measurementDue?: boolean;
}): { title: string; body: string } {
  const title = t('profile.notifications.weekly.title');
  const body = t('profile.notifications.weekly.body');
  if (!input?.measurementDue) {
    return { title, body };
  }

  return {
    title,
    body: `${body} ${t('profile.notifications.weekly.bodyMeasurementDue')}`,
  };
}

export function reminderChannelName(): string {
  return t('profile.notifications.channelName');
}
