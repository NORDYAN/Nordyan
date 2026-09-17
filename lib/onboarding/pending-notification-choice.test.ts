import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR,
  formatOnboardingDailyReminderHour,
  ONBOARDING_DAILY_REMINDER_HOURS,
  ONBOARDING_ENABLED_NOTIFICATION_PREFERENCES,
  PENDING_NOTIFICATION_CHOICE_KEY,
  onboardingEnabledNotificationPreferences,
  parsePendingNotificationChoice,
  resolveOnboardingDailyReminderHour,
  serializePendingNotificationChoice,
} from './pending-notification-choice';
import { createPendingNotificationChoiceStore } from './pending-notification-choice.store';

describe('pending notification choice', () => {
  it('serializes enabled with the selected daily hour and skipped without one', async () => {
    const storage = createMemoryPendingKeyValueStore();
    const store = createPendingNotificationChoiceStore(storage);

    assert.equal(await store.get(), null);
    await store.set({ choice: 'enabled', dailyHour: 7 });
    assert.deepEqual(await store.get(), { choice: 'enabled', dailyHour: 7 });
    assert.deepEqual(
      parsePendingNotificationChoice(await storage.getItem(PENDING_NOTIFICATION_CHOICE_KEY)),
      { choice: 'enabled', dailyHour: 7 },
    );

    await store.set({ choice: 'skipped' });
    assert.deepEqual(await store.get(), { choice: 'skipped' });
    assert.deepEqual(parsePendingNotificationChoice(serializePendingNotificationChoice({ choice: 'skipped' })), {
      choice: 'skipped',
    });
    assert.doesNotMatch(serializePendingNotificationChoice({ choice: 'skipped' }), /dailyHour/);
  });

  it('treats last saved onboarding choice as the winner', async () => {
    const store = createPendingNotificationChoiceStore(createMemoryPendingKeyValueStore());
    await store.set({ choice: 'enabled', dailyHour: 7 });
    await store.set({ choice: 'skipped' });
    await store.set({ choice: 'enabled', dailyHour: 9 });
    assert.deepEqual(await store.get(), { choice: 'enabled', dailyHour: 9 });
  });

  it('ignores unknown payloads and falls legacy enabled without dailyHour back to 08:00', () => {
    assert.equal(parsePendingNotificationChoice('{"version":1,"choice":"maybe"}'), null);
    assert.equal(parsePendingNotificationChoice('not-json'), null);
    assert.equal(parsePendingNotificationChoice(null), null);
    assert.deepEqual(parsePendingNotificationChoice('{"version":1,"choice":"enabled"}'), {
      choice: 'enabled',
      dailyHour: 8,
    });
    assert.deepEqual(parsePendingNotificationChoice('{"version":1,"choice":"enabled","dailyHour":11}'), {
      choice: 'enabled',
      dailyHour: 8,
    });
    assert.deepEqual(ONBOARDING_DAILY_REMINDER_HOURS, [7, 8, 9, 16, 17, 18]);
    assert.equal(DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR, 8);
    assert.equal(resolveOnboardingDailyReminderHour(undefined), 8);
    assert.equal(formatOnboardingDailyReminderHour(7), '07:00');
    assert.equal(formatOnboardingDailyReminderHour(8), '08:00');
    assert.equal(formatOnboardingDailyReminderHour(9), '09:00');
    assert.equal(formatOnboardingDailyReminderHour(16), '16:00');
    assert.equal(formatOnboardingDailyReminderHour(17), '17:00');
    assert.equal(formatOnboardingDailyReminderHour(18), '18:00');
    assert.deepEqual(parsePendingNotificationChoice('{"version":1,"choice":"enabled","dailyHour":16}'), {
      choice: 'enabled',
      dailyHour: 16,
    });
  });

  it('maps enabled hours to Daily + Weekly with minute 0', () => {
    assert.deepEqual(ONBOARDING_ENABLED_NOTIFICATION_PREFERENCES, {
      dailyEnabled: true,
      weeklyEnabled: true,
      dailyHour: 8,
      dailyMinute: 0,
    });
    assert.deepEqual(onboardingEnabledNotificationPreferences(7), {
      dailyEnabled: true,
      weeklyEnabled: true,
      dailyHour: 7,
      dailyMinute: 0,
    });
    assert.deepEqual(onboardingEnabledNotificationPreferences(9), {
      dailyEnabled: true,
      weeklyEnabled: true,
      dailyHour: 9,
      dailyMinute: 0,
    });
    assert.deepEqual(onboardingEnabledNotificationPreferences(16), {
      dailyEnabled: true,
      weeklyEnabled: true,
      dailyHour: 16,
      dailyMinute: 0,
    });
    assert.deepEqual(onboardingEnabledNotificationPreferences(18), {
      dailyEnabled: true,
      weeklyEnabled: true,
      dailyHour: 18,
      dailyMinute: 0,
    });
  });
});
