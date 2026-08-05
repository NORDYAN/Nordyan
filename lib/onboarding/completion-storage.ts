import AsyncStorage from '@react-native-async-storage/async-storage';

/** Legacy device-global flag — must not drive routing anymore. */
const LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY = '@nordyan/onboarding_complete';

function onboardingCompleteKeyForUser(userId: string): string {
  return `@nordyan/onboarding_complete/${userId}`;
}

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
