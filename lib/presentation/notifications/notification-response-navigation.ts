import type { AppGateResult } from '@/lib/onboarding/resolve-app-gate';

import { isNordyanReminderData } from './notification-tap';

export type NotificationResponseNavigationDecision = 'wait' | 'ignore' | 'evaluate-gate';

export function decideNotificationResponseNavigation(input: {
  authReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  data: unknown;
}): NotificationResponseNavigationDecision {
  if (!isNordyanReminderData(input.data)) {
    return 'ignore';
  }

  if (!input.authReady) {
    return 'wait';
  }

  if (!input.isAuthenticated || !input.userId) {
    return 'ignore';
  }

  return 'evaluate-gate';
}

export function mayOpenHomeForGateDestination(
  destination: AppGateResult['destination'],
): boolean {
  return destination === 'home';
}
