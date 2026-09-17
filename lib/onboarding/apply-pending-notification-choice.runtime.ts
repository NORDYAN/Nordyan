import type { NotificationPreferences } from '@/lib/presentation/notifications/notification-preferences';
import { notificationPreferencesStore } from '@/lib/presentation/notifications/notification-preferences.storage';
import { restoreNordyanNotificationSchedules } from '@/lib/presentation/notifications/sync-nordyan-notifications.runtime';

import {
  applyImmediateOnboardingNotificationChoice,
  applyPendingNotificationChoiceToUser,
} from './apply-pending-notification-choice';
import {
  clearPendingNotificationChoice,
  getPendingNotificationChoice,
} from './pending-notification-choice-storage';
import type { PendingNotificationIntent } from './pending-notification-choice';

const runtimeDeps = {
  clearPending: clearPendingNotificationChoice,
  setPreferences: (userId: string, prefs: NotificationPreferences) =>
    notificationPreferencesStore.set(userId, prefs),
  restoreSchedules: restoreNordyanNotificationSchedules,
};

export function applyPendingNotificationChoiceForAuthenticatedUser(userId: string) {
  return applyPendingNotificationChoiceToUser(userId, {
    ...runtimeDeps,
    getPending: getPendingNotificationChoice,
  });
}

export function applyImmediateOnboardingNotificationChoiceForUser(
  userId: string,
  choice: PendingNotificationIntent,
) {
  return applyImmediateOnboardingNotificationChoice(userId, choice, runtimeDeps);
}
