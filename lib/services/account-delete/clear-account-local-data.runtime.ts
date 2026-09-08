import AsyncStorage from '@react-native-async-storage/async-storage';

import { cancelNordyanScheduledNotifications } from '@/lib/presentation/notifications/sync-nordyan-notifications.runtime';
import { clearCoachLanguageSessionCache } from '@/lib/services/coach-language/sessionCache';
import { clearPendingInitialLifestyleForUser } from '@/lib/onboarding/pending-initial-lifestyle-storage';
import { clearPendingProfileMeasurementsForUser } from '@/lib/onboarding/pending-profile-storage';
import {
  clearPendingSignupVerification,
  getPendingSignupVerification,
} from '@/lib/onboarding/pending-signup-verification-storage';

import {
  clearAccountLocalData,
  type AccountLocalCleanupDeps,
} from './clear-account-local-data';

export function createAccountLocalCleanupDeps(): AccountLocalCleanupDeps {
  return {
    clearPendingProfileForUser: clearPendingProfileMeasurementsForUser,
    clearPendingLifestyleForUser: clearPendingInitialLifestyleForUser,
    removeItem: (key) => AsyncStorage.removeItem(key),
    getPendingSignupVerification,
    clearPendingSignupVerification,
    clearCoachLanguageSessionCache,
  };
}

export async function clearDeletedUserLocalData(userId: string): Promise<void> {
  await cancelNordyanScheduledNotifications();
  await clearAccountLocalData(userId, createAccountLocalCleanupDeps());
}
