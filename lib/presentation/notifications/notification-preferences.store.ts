import {
  notificationPreferencesStorageKey,
  parseNotificationPreferences,
  serializeNotificationPreferences,
  type NotificationPreferences,
} from './notification-preferences';

export type NotificationPreferencesKeyValueStore = {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
};

export type NotificationPreferencesStore = {
  get(userId: string): Promise<NotificationPreferences>;
  set(userId: string, prefs: NotificationPreferences): Promise<void>;
  remove(userId: string): Promise<void>;
};

export function createNotificationPreferencesStore(
  storage: NotificationPreferencesKeyValueStore,
): NotificationPreferencesStore {
  return {
    async get(userId: string): Promise<NotificationPreferences> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return parseNotificationPreferences(null);
      }

      try {
        const raw = await storage.getItem(notificationPreferencesStorageKey(trimmed));
        return parseNotificationPreferences(raw);
      } catch {
        return parseNotificationPreferences(null);
      }
    },

    async set(userId: string, prefs: NotificationPreferences): Promise<void> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return;
      }
      await storage.setItem(
        notificationPreferencesStorageKey(trimmed),
        serializeNotificationPreferences(prefs),
      );
    },

    async remove(userId: string): Promise<void> {
      const trimmed = userId.trim();
      if (!trimmed) {
        return;
      }
      await storage.removeItem(notificationPreferencesStorageKey(trimmed));
    },
  };
}
