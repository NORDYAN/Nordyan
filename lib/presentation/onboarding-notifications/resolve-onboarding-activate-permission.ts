import type { NotificationPermissionState } from '@/lib/presentation/notifications/notification-permission';
import type { PendingNotificationChoice } from '@/lib/onboarding/pending-notification-choice';

export type OnboardingActivatePermissionDeps = {
  getState: () => Promise<NotificationPermissionState | 'unsupported'>;
  request: () => Promise<NotificationPermissionState | 'unsupported'>;
};

export async function resolveOnboardingActivatePermission(
  deps: OnboardingActivatePermissionDeps,
): Promise<PendingNotificationChoice> {
  const current = await deps.getState();
  if (current === 'granted') {
    return 'enabled';
  }
  if (current !== 'undetermined') {
    return 'skipped';
  }

  const requested = await deps.request();
  return requested === 'granted' ? 'enabled' : 'skipped';
}
