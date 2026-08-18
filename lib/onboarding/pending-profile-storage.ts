import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProfileMeasurements } from '@/lib/domain/profile';

import type { PendingUnownedWriteResult } from './onboarding-forensics';
import { selectVisiblePendingValue } from './pending-onboarding-visible';
import { createPendingProfileStore } from './pending-profile-store';

const pendingProfileStore = createPendingProfileStore(AsyncStorage);

export function getPendingProfileMeasurements(): Promise<ProfileMeasurements | null> {
  return pendingProfileStore.getUnowned();
}

export async function getVisiblePendingProfileMeasurements(
  userId: string | null,
): Promise<ProfileMeasurements | null> {
  const ownedByViewer = userId ? await pendingProfileStore.getForUser(userId) : null;
  const unowned = await pendingProfileStore.getUnowned();
  return selectVisiblePendingValue({
    viewerUserId: userId,
    ownedByViewer,
    unowned,
  });
}

export function getPendingProfileMeasurementsForUser(
  userId: string,
): Promise<ProfileMeasurements | null> {
  return pendingProfileStore.getForUser(userId);
}

export function getPendingProfileOwnerState() {
  return pendingProfileStore.getOwnerState();
}

export function getPendingProfileBindState(userId: string) {
  return pendingProfileStore.getBindState(userId);
}

export async function setPendingProfileMeasurements(
  measurements: ProfileMeasurements,
): Promise<PendingUnownedWriteResult> {
  return pendingProfileStore.saveUnowned(measurements);
}

export async function updatePendingProfileMeasurements(
  patch: Partial<ProfileMeasurements>,
): Promise<ProfileMeasurements | null> {
  return pendingProfileStore.updateUnowned(patch);
}

export function bindPendingProfileMeasurementsToUser(userId: string) {
  return pendingProfileStore.bindToUser(userId);
}

export function releasePendingProfileMeasurementsBinding(userId: string): Promise<void> {
  return pendingProfileStore.releaseBinding(userId);
}

export async function clearPendingProfileMeasurements(): Promise<void> {
  await pendingProfileStore.clear();
}

export function clearPendingProfileMeasurementsForUser(userId: string): Promise<void> {
  return pendingProfileStore.clearForUser(userId);
}

export function clearUnownedPendingProfileMeasurements(): Promise<void> {
  return pendingProfileStore.clearUnowned();
}
