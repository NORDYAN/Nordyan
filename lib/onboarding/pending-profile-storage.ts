import AsyncStorage from '@react-native-async-storage/async-storage';

import type { ProfileMeasurements } from '@/lib/domain/profile';

const PENDING_PROFILE_KEY = '@nordyan/pending_profile_measurements';

export async function getPendingProfileMeasurements(): Promise<ProfileMeasurements | null> {
  const raw = await AsyncStorage.getItem(PENDING_PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as ProfileMeasurements;
    if (typeof parsed.heightCm !== 'number' || typeof parsed.weightKg !== 'number') {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function setPendingProfileMeasurements(
  measurements: ProfileMeasurements,
): Promise<void> {
  await AsyncStorage.setItem(PENDING_PROFILE_KEY, JSON.stringify(measurements));
}

export async function updatePendingProfileMeasurements(
  patch: Partial<ProfileMeasurements>,
): Promise<ProfileMeasurements | null> {
  const existing = await getPendingProfileMeasurements();
  if (!existing) {
    return null;
  }

  const next: ProfileMeasurements = { ...existing, ...patch };
  await setPendingProfileMeasurements(next);
  return next;
}

export async function clearPendingProfileMeasurements(): Promise<void> {
  await AsyncStorage.removeItem(PENDING_PROFILE_KEY);
}
