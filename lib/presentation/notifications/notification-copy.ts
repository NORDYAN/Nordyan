import { t } from '@/lib/i18n';

export function dailyFocusReminderCopy(): { title: string; body: string } {
  return {
    title: t('profile.notifications.daily.title'),
    body: t('profile.notifications.daily.body'),
  };
}

export function weeklyCheckInReminderCopy(): { title: string; body: string } {
  return {
    title: t('profile.notifications.weekly.title'),
    body: t('profile.notifications.weekly.body'),
  };
}

export function reminderChannelName(): string {
  return t('profile.notifications.channelName');
}
