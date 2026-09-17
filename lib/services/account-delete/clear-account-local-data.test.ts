import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { LANGUAGE_STORAGE_MANUAL_KEY, languageStorageUserKey } from '../../i18n/locales';
import {
  LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY,
  onboardingCompleteKeyForUser,
} from '../../onboarding/onboarding-complete-keys';
import { PENDING_INITIAL_LIFESTYLE_KEY } from '../../onboarding/pending-initial-lifestyle-store';
import { PENDING_PROFILE_KEY } from '../../onboarding/pending-profile-store';
import { coachHomeBodyFatDiscoveryKey } from '../../presentation/coach-home/coach-home-body-fat-discovery.store';
import { notificationPreferencesStorageKey } from '../../presentation/notifications/notification-preferences';
import { PENDING_NOTIFICATION_CHOICE_KEY } from '../../onboarding/pending-notification-choice';

import { clearAccountLocalData } from './clear-account-local-data';

describe('clearAccountLocalData', () => {
  it('removes only the deleted user keys and leaves other users and device locale', async () => {
    const removed: string[] = [];
    const clearedUsers: string[] = [];
    let signupCleared = false;
    let cacheCleared = false;

    await clearAccountLocalData('user-a', {
      clearPendingProfileForUser: async (userId) => {
        clearedUsers.push(`profile:${userId}`);
      },
      clearPendingLifestyleForUser: async (userId) => {
        clearedUsers.push(`lifestyle:${userId}`);
      },
      removeItem: async (key) => {
        removed.push(key);
      },
      getPendingSignupVerification: async () => ({ ownerId: 'user-a' }),
      clearPendingSignupVerification: async () => {
        signupCleared = true;
      },
      clearCoachLanguageSessionCache: () => {
        cacheCleared = true;
      },
    });

    assert.deepEqual(clearedUsers, ['profile:user-a', 'lifestyle:user-a']);
    assert.deepEqual(removed, [
      onboardingCompleteKeyForUser('user-a'),
      LEGACY_GLOBAL_ONBOARDING_COMPLETE_KEY,
      languageStorageUserKey('user-a'),
      coachHomeBodyFatDiscoveryKey('user-a'),
      notificationPreferencesStorageKey('user-a'),
      PENDING_NOTIFICATION_CHOICE_KEY,
    ]);
    assert.equal(signupCleared, true);
    assert.equal(cacheCleared, true);
    assert.equal(removed.includes(languageStorageUserKey('user-b')), false);
    assert.equal(removed.includes(LANGUAGE_STORAGE_MANUAL_KEY), false);
    assert.equal(removed.includes(PENDING_PROFILE_KEY), false);
    assert.equal(removed.includes(PENDING_INITIAL_LIFESTYLE_KEY), false);
  });

  it('does not clear pending signup verification owned by another user', async () => {
    let signupCleared = false;

    await clearAccountLocalData('user-a', {
      clearPendingProfileForUser: async () => undefined,
      clearPendingLifestyleForUser: async () => undefined,
      removeItem: async () => undefined,
      getPendingSignupVerification: async () => ({ ownerId: 'user-b' }),
      clearPendingSignupVerification: async () => {
        signupCleared = true;
      },
      clearCoachLanguageSessionCache: () => undefined,
    });

    assert.equal(signupCleared, false);
  });
});
