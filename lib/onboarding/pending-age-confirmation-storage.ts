import AsyncStorage from '@react-native-async-storage/async-storage';

import { createPendingAgeConfirmationStore } from './pending-age-confirmation-store';

const pendingAgeConfirmationStore = createPendingAgeConfirmationStore(AsyncStorage);

export function hasPendingAgeConfirmation(): Promise<boolean> {
  return pendingAgeConfirmationStore.hasConfirmed18Plus();
}

export function savePendingAgeConfirmation(): Promise<void> {
  return pendingAgeConfirmationStore.saveConfirmed18Plus();
}

export function clearUnownedPendingAgeConfirmation(): Promise<void> {
  return pendingAgeConfirmationStore.clear();
}
