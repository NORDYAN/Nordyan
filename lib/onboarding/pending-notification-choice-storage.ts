import AsyncStorage from '@react-native-async-storage/async-storage';

import { createPendingNotificationChoiceStore } from './pending-notification-choice.store';
import type { PendingNotificationIntent } from './pending-notification-choice';

const pendingNotificationChoiceStore = createPendingNotificationChoiceStore(AsyncStorage);

export function getPendingNotificationChoice(): Promise<PendingNotificationIntent | null> {
  return pendingNotificationChoiceStore.get();
}

export function savePendingNotificationChoice(
  intent: PendingNotificationIntent,
): Promise<void> {
  return pendingNotificationChoiceStore.set(intent);
}

export function clearPendingNotificationChoice(): Promise<void> {
  return pendingNotificationChoiceStore.clear();
}
