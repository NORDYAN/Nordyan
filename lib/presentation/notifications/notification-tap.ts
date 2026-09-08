import { routes } from '@/constants/routes';

import type { NordyanReminderType } from './notification-preferences';

export const NORDYAN_NOTIFICATION_HOME_ROUTE = routes.home;

export function isNordyanReminderData(
  data: unknown,
): data is { type: NordyanReminderType } {
  if (data === null || typeof data !== 'object') {
    return false;
  }

  const type = (data as { type?: unknown }).type;
  return type === 'daily-focus' || type === 'weekly-check-in';
}

export function homeRouteForNotificationTap(): typeof routes.home {
  return NORDYAN_NOTIFICATION_HOME_ROUTE;
}
