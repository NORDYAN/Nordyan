import { Platform } from 'react-native';

export function isNativeNotificationsSupported(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}
