import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  applyImmediateOnboardingNotificationChoice,
  applyPendingNotificationChoiceToUser,
} from './apply-pending-notification-choice';
import {
  onboardingEnabledNotificationPreferences,
  type PendingNotificationIntent,
} from './pending-notification-choice';
import type { NotificationPreferences } from '@/lib/presentation/notifications/notification-preferences';
import { DEFAULT_NOTIFICATION_PREFERENCES } from '@/lib/presentation/notifications/notification-preferences';

function createHarness(initialPending: PendingNotificationIntent | null = null) {
  let pending: PendingNotificationIntent | null = initialPending;
  const prefsByUser = new Map<string, NotificationPreferences>();
  const restored: string[] = [];

  const deps = {
    getPending: async () => pending,
    clearPending: async () => {
      pending = null;
    },
    setPreferences: async (userId: string, prefs: NotificationPreferences) => {
      prefsByUser.set(userId, prefs);
    },
    restoreSchedules: async (userId: string) => {
      restored.push(userId);
    },
  };

  return { deps, prefsByUser, restored, getPending: () => pending };
}

describe('applyPendingNotificationChoiceToUser', () => {
  it('writes both reminders at the selected hour then clears pending when enabled', async () => {
    const harness = createHarness({ choice: 'enabled', dailyHour: 7 });
    const result = await applyPendingNotificationChoiceToUser('user-a', harness.deps);

    assert.deepEqual(result, { applied: true, choice: 'enabled' });
    assert.deepEqual(harness.prefsByUser.get('user-a'), onboardingEnabledNotificationPreferences(7));
    assert.equal(harness.prefsByUser.get('user-a')?.dailyMinute, 0);
    assert.deepEqual(harness.restored, ['user-a']);
    assert.equal(harness.getPending(), null);
  });

  it('applies 08:00 and 09:00 from pending enabled intents', async () => {
    const eight = createHarness({ choice: 'enabled', dailyHour: 8 });
    await applyPendingNotificationChoiceToUser('user-a', eight.deps);
    assert.deepEqual(eight.prefsByUser.get('user-a'), onboardingEnabledNotificationPreferences(8));

    const nine = createHarness({ choice: 'enabled', dailyHour: 9 });
    await applyPendingNotificationChoiceToUser('user-a', nine.deps);
    assert.deepEqual(nine.prefsByUser.get('user-a'), onboardingEnabledNotificationPreferences(9));

    const evening = createHarness({ choice: 'enabled', dailyHour: 17 });
    await applyPendingNotificationChoiceToUser('user-a', evening.deps);
    assert.deepEqual(evening.prefsByUser.get('user-a'), onboardingEnabledNotificationPreferences(17));
  });

  it('does not enable reminders when skipped and still clears pending', async () => {
    const harness = createHarness({ choice: 'skipped' });
    const result = await applyPendingNotificationChoiceToUser('user-a', harness.deps);

    assert.deepEqual(result, { applied: true, choice: 'skipped' });
    assert.equal(harness.prefsByUser.has('user-a'), false);
    assert.deepEqual(harness.restored, []);
    assert.equal(harness.getPending(), null);
  });

  it('is a no-op when pending is absent and is idempotent after a successful apply', async () => {
    const harness = createHarness({ choice: 'enabled', dailyHour: 8 });
    await applyPendingNotificationChoiceToUser('user-a', harness.deps);
    const second = await applyPendingNotificationChoiceToUser('user-a', harness.deps);

    assert.deepEqual(second, { applied: false, reason: 'absent-pending' });
    assert.deepEqual(harness.restored, ['user-a']);
  });

  it('does not apply anonymous pending to an empty user id', async () => {
    const harness = createHarness({ choice: 'enabled', dailyHour: 8 });
    const result = await applyPendingNotificationChoiceToUser('  ', harness.deps);
    assert.deepEqual(result, { applied: false, reason: 'absent-user' });
    assert.deepEqual(harness.getPending(), { choice: 'enabled', dailyHour: 8 });
    assert.equal(harness.prefsByUser.size, 0);
  });
});

describe('applyImmediateOnboardingNotificationChoice', () => {
  it('enables the authenticated recovery path without leaving pending behind', async () => {
    const harness = createHarness({ choice: 'skipped' });
    await applyImmediateOnboardingNotificationChoice(
      'user-b',
      { choice: 'enabled', dailyHour: 9 },
      {
        clearPending: harness.deps.clearPending,
        setPreferences: harness.deps.setPreferences,
        restoreSchedules: harness.deps.restoreSchedules,
      },
    );

    assert.deepEqual(harness.prefsByUser.get('user-b'), onboardingEnabledNotificationPreferences(9));
    assert.deepEqual(harness.restored, ['user-b']);
    assert.equal(harness.getPending(), null);
  });

  it('keeps existing defaults when an authenticated user skips', async () => {
    const harness = createHarness({ choice: 'enabled', dailyHour: 7 });
    await applyImmediateOnboardingNotificationChoice('user-b', { choice: 'skipped' }, {
      clearPending: harness.deps.clearPending,
      setPreferences: harness.deps.setPreferences,
      restoreSchedules: harness.deps.restoreSchedules,
    });

    assert.equal(harness.prefsByUser.has('user-b'), false);
    assert.deepEqual(harness.restored, []);
    assert.equal(harness.getPending(), null);
    assert.deepEqual(DEFAULT_NOTIFICATION_PREFERENCES.dailyEnabled, false);
  });
});
