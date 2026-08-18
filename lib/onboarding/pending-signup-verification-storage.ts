import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  createPendingSignupVerificationStore,
  type PendingSignupVerification,
} from './pending-signup-verification';

const pendingSignupVerificationStore = createPendingSignupVerificationStore(AsyncStorage);

export function savePendingSignupVerification(
  input: PendingSignupVerification,
): Promise<void> {
  return pendingSignupVerificationStore.save(input);
}

export function getPendingSignupVerification(): Promise<PendingSignupVerification | null> {
  return pendingSignupVerificationStore.get();
}

export function clearPendingSignupVerification(): Promise<void> {
  return pendingSignupVerificationStore.clear();
}
