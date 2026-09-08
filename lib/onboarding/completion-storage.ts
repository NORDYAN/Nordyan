import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY,
  onboardingCompleteKeyForUser,
} from './onboarding-complete-keys';

async function clearLegacyGlobalOnboardingFlag(): Promise<void> {
  await AsyncStorage.removeItem(LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY);
}

/**
 * Temporary per-user cache. Prefer Supabase profile via resolveOnboardingGate.
 * Returns null on cache miss.
 */
export async function getOnboardingCompleteForUser(userId: string): Promise<boolean | null> {
  await clearLegacyGlobalOnboardingFlag();
  const value = await AsyncStorage.getItem(onboardingCompleteKeyForUser(userId));
  if (value === null) {
    return null;
  }
  return value === 'true';
}

export async function setOnboardingCompleteForUser(
  userId: string,
  complete: boolean,
): Promise<void> {
  await clearLegacyGlobalOnboardingFlag();
  await AsyncStorage.setItem(onboardingCompleteKeyForUser(userId), complete ? 'true' : 'false');
}
