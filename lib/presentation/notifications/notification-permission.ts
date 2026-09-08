export type NotificationPermissionState = 'granted' | 'denied' | 'undetermined';

export function interpretNotificationPermission(input: {
  granted: boolean;
  status?: string | null;
  iosStatus?: number | null;
}): NotificationPermissionState {
  if (input.iosStatus === 2 || input.iosStatus === 3 || input.iosStatus === 4) {
    return 'granted';
  }
  if (input.iosStatus === 0) {
    return 'undetermined';
  }
  if (input.iosStatus === 1) {
    return 'denied';
  }
  if (input.granted || input.status === 'granted') {
    return 'granted';
  }
  if (input.status === 'undetermined') {
    return 'undetermined';
  }
  return 'denied';
}

export function toggleEnabledAfterPermission(
  wantsEnabled: boolean,
  permission: NotificationPermissionState,
): boolean {
  return wantsEnabled && permission === 'granted';
}
