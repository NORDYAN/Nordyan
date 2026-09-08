export type ScheduleUserCursor = string | null | undefined;

export type NotificationScheduleSyncDecision =
  | { kind: 'noop' }
  | { kind: 'hydrate-idle' }
  | { kind: 'hydrate-restore'; userId: string }
  | { kind: 'login-restore'; userId: string }
  | { kind: 'locale-restore'; userId: string }
  | { kind: 'switch-cancel-restore'; userId: string }
  | { kind: 'logout-cancel' };

/**
 * Distinguishes cold-start hydration from a real account switch.
 * `previousUserId === undefined` means auth has not produced a stable cursor yet.
 */
export function decideNotificationScheduleSync(input: {
  authReady: boolean;
  previousUserId: ScheduleUserCursor;
  nextUserId: string | null;
  localeChanged: boolean;
}): NotificationScheduleSyncDecision {
  if (!input.authReady) {
    return { kind: 'noop' };
  }

  if (input.previousUserId === undefined) {
    return input.nextUserId
      ? { kind: 'hydrate-restore', userId: input.nextUserId }
      : { kind: 'hydrate-idle' };
  }

  if (input.previousUserId === input.nextUserId) {
    if (input.nextUserId && input.localeChanged) {
      return { kind: 'locale-restore', userId: input.nextUserId };
    }
    return { kind: 'noop' };
  }

  if (input.nextUserId === null) {
    return { kind: 'logout-cancel' };
  }

  if (input.previousUserId === null) {
    return { kind: 'login-restore', userId: input.nextUserId };
  }

  return { kind: 'switch-cancel-restore', userId: input.nextUserId };
}
