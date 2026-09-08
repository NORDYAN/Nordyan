import AsyncStorage from '@react-native-async-storage/async-storage';

import type { HealthDataConsentGrant } from '@/lib/domain/health-data-consent';

import { selectVisiblePendingValue } from './pending-onboarding-visible';
import {
  createPendingHealthDataConsentStore,
  type PendingHealthDataConsentStore,
} from './pending-health-data-consent-store';

const pendingHealthDataConsentStore: PendingHealthDataConsentStore =
  createPendingHealthDataConsentStore(AsyncStorage);

export function savePendingHealthDataConsent(
  grant: HealthDataConsentGrant,
  userId?: string | null,
): Promise<void> {
  return pendingHealthDataConsentStore.savePendingHealthDataConsent(grant, userId);
}

export function getPendingHealthDataConsent(): Promise<HealthDataConsentGrant | null> {
  return pendingHealthDataConsentStore.getPendingHealthDataConsent();
}

export async function getVisiblePendingHealthDataConsent(
  userId: string | null,
): Promise<HealthDataConsentGrant | null> {
  const ownedByViewer = userId
    ? await pendingHealthDataConsentStore.getPendingHealthDataConsentForUser(userId)
    : null;
  const unowned = await pendingHealthDataConsentStore.getPendingHealthDataConsent();
  return selectVisiblePendingValue({
    viewerUserId: userId,
    ownedByViewer,
    unowned,
  });
}

export function getPendingHealthDataConsentForUser(
  userId: string,
): Promise<HealthDataConsentGrant | null> {
  return pendingHealthDataConsentStore.getPendingHealthDataConsentForUser(userId);
}

export function getPendingHealthDataConsentBindState(userId: string) {
  return pendingHealthDataConsentStore.getBindState(userId);
}

export function bindPendingHealthDataConsentToUser(userId: string) {
  return pendingHealthDataConsentStore.bindPendingHealthDataConsentToUser(userId);
}

export function clearPendingHealthDataConsentForUser(userId: string): Promise<void> {
  return pendingHealthDataConsentStore.clearPendingHealthDataConsentForUser(userId);
}

export function clearUnownedPendingHealthDataConsent(): Promise<void> {
  return pendingHealthDataConsentStore.clearUnownedPendingHealthDataConsent();
}
