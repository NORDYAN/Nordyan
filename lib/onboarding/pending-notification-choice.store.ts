import type { PendingKeyValueStore } from './pending-key-value-store';
import {
  PENDING_NOTIFICATION_CHOICE_KEY,
  parsePendingNotificationChoice,
  serializePendingNotificationChoice,
  type PendingNotificationIntent,
} from './pending-notification-choice';

export type PendingNotificationChoiceStore = {
  get(): Promise<PendingNotificationIntent | null>;
  set(intent: PendingNotificationIntent): Promise<void>;
  clear(): Promise<void>;
};

export function createPendingNotificationChoiceStore(
  storage: PendingKeyValueStore,
): PendingNotificationChoiceStore {
  return {
    async get(): Promise<PendingNotificationIntent | null> {
      try {
        return parsePendingNotificationChoice(await storage.getItem(PENDING_NOTIFICATION_CHOICE_KEY));
      } catch {
        return null;
      }
    },

    async set(intent: PendingNotificationIntent): Promise<void> {
      await storage.setItem(
        PENDING_NOTIFICATION_CHOICE_KEY,
        serializePendingNotificationChoice(intent),
      );
    },

    async clear(): Promise<void> {
      await storage.removeItem(PENDING_NOTIFICATION_CHOICE_KEY);
    },
  };
}
