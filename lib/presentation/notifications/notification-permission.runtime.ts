import * as Notifications from 'expo-notifications';

import { interpretNotificationPermission, type NotificationPermissionState } from './notification-permission';
import { isNativeNotificationsSupported } from './notifications-platform';

export async function getNotificationPermissionState(): Promise<
  NotificationPermissionState | 'unsupported'
> {
  if (!isNativeNotificationsSupported()) {
    return 'unsupported';
  }

  const settings = await Notifications.getPermissionsAsync();
  return interpretNotificationPermission({
    granted: settings.granted,
    status: settings.status,
    iosStatus: settings.ios?.status ?? null,
  });
}

export async function requestNotificationPermission(): Promise<
  NotificationPermissionState | 'unsupported'
> {
  if (!isNativeNotificationsSupported()) {
    return 'unsupported';
  }

  const settings = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return interpretNotificationPermission({
    granted: settings.granted,
    status: settings.status,
    iosStatus: settings.ios?.status ?? null,
  });
}
