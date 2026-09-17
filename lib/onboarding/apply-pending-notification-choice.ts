import type { NotificationPreferences } from '@/lib/presentation/notifications/notification-preferences';

import {
  onboardingEnabledNotificationPreferences,
  type PendingNotificationChoice,
  type PendingNotificationIntent,
} from './pending-notification-choice';

export type ApplyPendingNotificationChoiceDeps = {
  getPending: () => Promise<PendingNotificationIntent | null>;
  clearPending: () => Promise<void>;
  setPreferences: (userId: string, prefs: NotificationPreferences) => Promise<void>;
  restoreSchedules: (userId: string) => Promise<void>;
};

export type ApplyPendingNotificationChoiceResult =
  | { applied: false; reason: 'absent-user' | 'absent-pending' }
  | { applied: true; choice: PendingNotificationChoice };

export async function applyPendingNotificationChoiceToUser(
  userId: string,
  deps: ApplyPendingNotificationChoiceDeps,
): Promise<ApplyPendingNotificationChoiceResult> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return { applied: false, reason: 'absent-user' };
  }

  const pending = await deps.getPending();
  if (pending === null) {
    return { applied: false, reason: 'absent-pending' };
  }

  if (pending.choice === 'enabled') {
    await deps.setPreferences(
      trimmed,
      onboardingEnabledNotificationPreferences(pending.dailyHour),
    );
    await deps.restoreSchedules(trimmed);
  }

  await deps.clearPending();
  return { applied: true, choice: pending.choice };
}

export async function applyImmediateOnboardingNotificationChoice(
  userId: string,
  intent: PendingNotificationIntent,
  deps: Omit<ApplyPendingNotificationChoiceDeps, 'getPending'>,
): Promise<void> {
  const trimmed = userId.trim();
  if (!trimmed) {
    return;
  }

  if (intent.choice === 'enabled') {
    await deps.setPreferences(
      trimmed,
      onboardingEnabledNotificationPreferences(intent.dailyHour),
    );
    await deps.restoreSchedules(trimmed);
  }

  await deps.clearPending();
}
