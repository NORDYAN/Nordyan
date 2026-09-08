import { languageStorageUserKey } from '@/lib/i18n/locales';
import {
  LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY,
  onboardingCompleteKeyForUser,
} from '@/lib/onboarding/onboarding-complete-keys';
import { coachHomeBodyFatDiscoveryKey } from '@/lib/presentation/coach-home/coach-home-body-fat-discovery.store';
import { notificationPreferencesStorageKey } from '@/lib/presentation/notifications/notification-preferences';

export type AccountLocalCleanupDeps = {
  clearPendingProfileForUser: (userId: string) => Promise<void>;
  clearPendingLifestyleForUser: (userId: string) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  getPendingSignupVerification: () => Promise<{ ownerId: string } | null>;
  clearPendingSignupVerification: () => Promise<void>;
  clearCoachLanguageSessionCache: () => void;
};

/**
 * Removes only this user's on-device account data.
 * Does not touch device/manual locale or other users' pending drafts.
 */
export async function clearAccountLocalData(
  userId: string,
  deps: AccountLocalCleanupDeps,
): Promise<void> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return;
  }

  await deps.clearPendingProfileForUser(trimmed);
  await deps.clearPendingLifestyleForUser(trimmed);
  await deps.removeItem(onboardingCompleteKeyForUser(trimmed));
  await deps.removeItem(LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY);
  await deps.removeItem(languageStorageUserKey(trimmed));
  await deps.removeItem(coachHomeBodyFatDiscoveryKey(trimmed));
  await deps.removeItem(notificationPreferencesStorageKey(trimmed));

  const pendingSignup = await deps.getPendingSignupVerification();
  if (pendingSignup?.ownerId === trimmed) {
    await deps.clearPendingSignupVerification();
  }

  deps.clearCoachLanguageSessionCache();
}
