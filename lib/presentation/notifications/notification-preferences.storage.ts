import AsyncStorage from '@react-native-async-storage/async-storage';

import { createNotificationPreferencesStore } from './notification-preferences.store';

export const notificationPreferencesStore = createNotificationPreferencesStore(AsyncStorage);
