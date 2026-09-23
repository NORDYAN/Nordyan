import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { setActiveLocale } from '../../i18n';
import { planDailyFocusNotification } from './daily-focus-schedule';
import {
  interpretNotificationPermission,
  toggleEnabledAfterPermission,
} from './notification-permission';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  formatNotificationTime,
  notificationPreferenceFieldNames,
  notificationPreferencesStorageKey,
  parseNotificationPreferences,
  serializeNotificationPreferences,
} from './notification-preferences';
import {
  applyIosDailyTimePickerWheelEvent,
  beginIosDailyTimePickerSession,
  commitDailyTimeDraft,
  decideDailyTimePickerEvent,
  IOS_DAILY_TIME_PICKER_THEME,
  localHourMinuteFromDate,
  localTimeDateFromHourMinute,
  resolveIosDailyTimePickerCommit,
  shouldRebindIosPickerValueOnSet,
  shouldRefreshStoredPreferencesWhilePickerOpen,
} from './notification-time-picker';
import { homeRouteForNotificationTap, isNordyanReminderData } from './notification-tap';
import { markNotificationResponseConsumed, resetConsumedNotificationResponsesForTests } from './notification-response-consume';
import {
  decideNotificationResponseNavigation,
  mayOpenHomeForGateDestination,
} from './notification-response-navigation';
import { decideNotificationScheduleSync } from './notification-schedule-sync';
import { createNotificationPreferencesStore } from './notification-preferences.store';
import { weeklyCheckInReminderCopy } from './notification-copy';
import {
  calendarDaysSinceMeasuredAt,
  isWeeklyMeasurementDue,
  weeklyMeasurementDueFromHistoryResult,
} from './notification-measurement-due';
import {
  getWeeklyCheckInReminderDate,
  planWeeklyCheckInNotification,
} from './weekly-check-in-schedule';

afterEach(() => {
  setActiveLocale('sv');
  resetConsumedNotificationResponsesForTests();
});

const HEALTH_OR_PII =
  /userId|user_id|email|Health Score|healthScore|measurement|midjemått|kroppsfett|Coach|device|diagnostics|actionId|weeklyFocus|dailyFocusId/i;
const APPROVED_NOTIFICATION_TITLE = 'NORDYAN Coach';

function assertApprovedNotificationCopy(title: string, body: string): void {
  assert.equal(title, APPROVED_NOTIFICATION_TITLE);
  assert.doesNotMatch(body, HEALTH_OR_PII);
}

describe('notification preferences', () => {
  it('defaults both reminders off at 08:00 and uses a per-user storage key', () => {
    assert.deepEqual(DEFAULT_NOTIFICATION_PREFERENCES, {
      dailyEnabled: false,
      dailyHour: 8,
      dailyMinute: 0,
      weeklyEnabled: false,
    });
    assert.equal(
      notificationPreferencesStorageKey('user-a'),
      '@nordyan/notifications/user/user-a',
    );
    assert.notEqual(
      notificationPreferencesStorageKey('user-a'),
      notificationPreferencesStorageKey('user-b'),
    );
    assert.deepEqual(notificationPreferenceFieldNames(), [
      'dailyEnabled',
      'dailyHour',
      'dailyMinute',
      'weeklyEnabled',
    ]);
    assert.doesNotMatch(serializeNotificationPreferences(DEFAULT_NOTIFICATION_PREFERENCES), HEALTH_OR_PII);
  });

  it('parses only the known preference fields', () => {
    const parsed = parseNotificationPreferences(
      JSON.stringify({
        dailyEnabled: true,
        dailyHour: 7,
        dailyMinute: 15,
        weeklyEnabled: true,
        email: 'a@b.c',
        healthScore: 72,
      }),
    );
    assert.deepEqual(parsed, {
      dailyEnabled: true,
      dailyHour: 7,
      dailyMinute: 15,
      weeklyEnabled: true,
    });
    assert.doesNotMatch(serializeNotificationPreferences(parsed), HEALTH_OR_PII);
  });

  it('keeps preferences isolated per user in the store', async () => {
    const memory = new Map<string, string>();
    const store = createNotificationPreferencesStore({
      getItem: async (key) => memory.get(key) ?? null,
      setItem: async (key, value) => {
        memory.set(key, value);
      },
      removeItem: async (key) => {
        memory.delete(key);
      },
    });

    await store.set('user-a', { ...DEFAULT_NOTIFICATION_PREFERENCES, dailyEnabled: true });
    await store.set('user-b', { ...DEFAULT_NOTIFICATION_PREFERENCES, weeklyEnabled: true });

    assert.equal((await store.get('user-a')).dailyEnabled, true);
    assert.equal((await store.get('user-a')).weeklyEnabled, false);
    assert.equal((await store.get('user-b')).weeklyEnabled, true);
    assert.equal((await store.get('user-b')).dailyEnabled, false);

    await store.remove('user-a');
    assert.equal((await store.get('user-a')).dailyEnabled, false);
    assert.equal((await store.get('user-b')).weeklyEnabled, true);
  });
});

describe('Daily Focus time picker draft', () => {
  const saved = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    dailyEnabled: true,
    dailyHour: 17,
    dailyMinute: 45,
  };

  it('defaults unsaved preferences to 08:00', () => {
    assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.dailyHour, 8);
    assert.equal(DEFAULT_NOTIFICATION_PREFERENCES.dailyMinute, 0);
    assert.equal(formatNotificationTime(DEFAULT_NOTIFICATION_PREFERENCES.dailyHour, DEFAULT_NOTIFICATION_PREFERENCES.dailyMinute), '08:00');
    const draft = localTimeDateFromHourMinute(
      DEFAULT_NOTIFICATION_PREFERENCES.dailyHour,
      DEFAULT_NOTIFICATION_PREFERENCES.dailyMinute,
      new Date(2026, 7, 26, 12, 0, 0),
    );
    assert.deepEqual(localHourMinuteFromDate(draft), { hour: 8, minute: 0 });
  });

  it('opens the picker at the saved 17:45 local time', () => {
    const now = new Date(2026, 7, 26, 12, 0, 0);
    const draft = localTimeDateFromHourMinute(saved.dailyHour, saved.dailyMinute, now);
    assert.equal(draft.getHours(), 17);
    assert.equal(draft.getMinutes(), 45);
    assert.equal(formatNotificationTime(saved.dailyHour, saved.dailyMinute), '17:45');
  });

  it('updates a draft on iOS wheel movement without committing', () => {
    const selected = localTimeDateFromHourMinute(7, 10, new Date(2026, 7, 26, 12, 0, 0));
    const decision = decideDailyTimePickerEvent({
      platform: 'ios',
      eventType: 'set',
      selected,
    });
    assert.equal(decision.action, 'remember-selection');
    if (decision.action === 'remember-selection') {
      assert.deepEqual(localHourMinuteFromDate(decision.selection), { hour: 7, minute: 10 });
    }
    assert.deepEqual(saved.dailyHour, 17);
    assert.deepEqual(saved.dailyMinute, 45);
  });

  it('keeps the iOS picker value frozen while remembering the latest local selection', () => {
    const opened = new Date(2026, 7, 26, 12, 0, 0);
    const session = beginIosDailyTimePickerSession(17, 45, opened);
    assert.equal(shouldRebindIosPickerValueOnSet(), false);
    assert.equal(session.pickerValue, session.selection);
    assert.deepEqual(localHourMinuteFromDate(session.pickerValue), { hour: 17, minute: 45 });

    const first = applyIosDailyTimePickerWheelEvent(session, new Date(2026, 7, 26, 9, 30, 47, 891));
    assert.equal(first.pickerValue, session.pickerValue);
    assert.deepEqual(localHourMinuteFromDate(first.selection), { hour: 9, minute: 30 });
    assert.deepEqual(localHourMinuteFromDate(first.pickerValue), { hour: 17, minute: 45 });

    const second = applyIosDailyTimePickerWheelEvent(first, new Date(2001, 0, 1, 7, 10, 12, 5));
    assert.equal(second.pickerValue, session.pickerValue);
    assert.deepEqual(localHourMinuteFromDate(second.selection), { hour: 7, minute: 10 });
    assert.equal(second.selection.getFullYear(), 2001);
    assert.notEqual(second.pickerValue.getFullYear(), 2001);

    const committed = commitDailyTimeDraft(saved, resolveIosDailyTimePickerCommit(second));
    assert.equal(committed.dailyHour, 7);
    assert.equal(committed.dailyMinute, 10);
    assert.equal(saved.dailyHour, 17);
    assert.equal(saved.dailyMinute, 45);
  });

  it('commits the opened iOS time on Klar when the wheel never moves', () => {
    const session = beginIosDailyTimePickerSession(17, 45, new Date(2026, 7, 26, 12, 0, 0));
    const committed = commitDailyTimeDraft(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, dailyEnabled: true, dailyHour: 8, dailyMinute: 0 },
      resolveIosDailyTimePickerCommit(session),
    );
    assert.equal(committed.dailyHour, 17);
    assert.equal(committed.dailyMinute, 45);
    assert.equal(formatNotificationTime(committed.dailyHour, committed.dailyMinute), '17:45');
  });

  it('normalizes an iOS wheel selection to a local 09:30 Date without rebinding the picker', () => {
    const session = beginIosDailyTimePickerSession(17, 45, new Date(2026, 7, 26, 12, 0, 0));
    const unstableSelected = new Date(2026, 7, 26, 9, 30, 47, 891);
    const decision = decideDailyTimePickerEvent({
      platform: 'ios',
      eventType: 'set',
      selected: unstableSelected,
    });
    assert.equal(decision.action, 'remember-selection');
    if (decision.action === 'remember-selection') {
      const next = applyIosDailyTimePickerWheelEvent(session, decision.selection);
      assert.equal(next.pickerValue, session.pickerValue);
      assert.notEqual(next.selection, unstableSelected);
      assert.deepEqual(localHourMinuteFromDate(next.selection), { hour: 9, minute: 30 });
      assert.equal(next.selection.getSeconds(), 0);
      assert.equal(formatNotificationTime(next.selection.getHours(), next.selection.getMinutes()), '09:30');
    }
    assert.equal(saved.dailyHour, 17);
    assert.equal(saved.dailyMinute, 45);
  });

  it('does not snap an iOS selection of 14:20 to 01:00 while leaving prefs untouched', () => {
    const selected = new Date(2026, 7, 26, 14, 20, 12, 5);
    const decision = decideDailyTimePickerEvent({
      platform: 'ios',
      eventType: 'set',
      selected,
    });
    assert.equal(decision.action, 'remember-selection');
    if (decision.action === 'remember-selection') {
      assert.deepEqual(localHourMinuteFromDate(decision.selection), { hour: 14, minute: 20 });
      assert.notEqual(decision.selection.getHours(), 1);
      assert.notEqual(
        formatNotificationTime(decision.selection.getHours(), decision.selection.getMinutes()),
        '01:00',
      );
    }
    assert.equal(saved.dailyHour, 17);
    assert.equal(saved.dailyMinute, 45);
  });

  it('keeps the native iOS calendar day on the remembered selection, not the picker value', () => {
    const session = beginIosDailyTimePickerSession(8, 0, new Date(2026, 7, 26, 12, 0, 0));
    const selected = new Date(2001, 0, 1, 14, 20, 47, 891);
    const next = applyIosDailyTimePickerWheelEvent(session, selected);
    assert.equal(next.pickerValue, session.pickerValue);
    assert.equal(next.selection.getFullYear(), 2001);
    assert.equal(next.selection.getMonth(), 0);
    assert.equal(next.selection.getDate(), 1);
    assert.deepEqual(localHourMinuteFromDate(next.selection), { hour: 14, minute: 20 });
    assert.equal(next.pickerValue.getFullYear(), 2026);
  });

  it('preserves local hour and minute from an epoch/UTC-style native Date on the selection only', () => {
    const session = beginIosDailyTimePickerSession(8, 0, new Date(2026, 7, 26, 12, 0, 0));
    const selected = new Date(0);
    const expected = localHourMinuteFromDate(selected);
    const next = applyIosDailyTimePickerWheelEvent(session, selected);
    assert.equal(next.pickerValue, session.pickerValue);
    assert.deepEqual(localHourMinuteFromDate(next.selection), expected);
    assert.equal(next.selection.getHours(), selected.getHours());
    assert.equal(next.selection.getMinutes(), selected.getMinutes());
  });

  it('keeps Android commit-on-set behavior unchanged', () => {
    const selected = new Date(2026, 7, 26, 11, 5, 33, 12);
    const decision = decideDailyTimePickerEvent({
      platform: 'android',
      eventType: 'set',
      selected,
    });
    assert.deepEqual(decision, { action: 'commit', hour: 11, minute: 5 });
  });

  it('commits the draft hour and minute only on Klar, then schedules once', () => {
    const draft = localTimeDateFromHourMinute(17, 45, new Date(2026, 7, 26, 12, 0, 0));
    const committed = commitDailyTimeDraft(
      { ...DEFAULT_NOTIFICATION_PREFERENCES, dailyEnabled: true, dailyHour: 8, dailyMinute: 0 },
      draft,
    );
    assert.equal(committed.dailyHour, 17);
    assert.equal(committed.dailyMinute, 45);
    assert.equal(formatNotificationTime(committed.dailyHour, committed.dailyMinute), '17:45');

    const plan = planDailyFocusNotification(committed);
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.identifier, 'nordyan-daily-focus');
      assert.equal(plan.hour, 17);
      assert.equal(plan.minute, 45);
      assert.equal(plan.triggerType, 'daily');
    }
  });

  it('keeps the saved time when the picker is dismissed', () => {
    assert.deepEqual(
      decideDailyTimePickerEvent({ platform: 'android', eventType: 'dismissed' }),
      { action: 'dismiss' },
    );
    assert.equal(
      decideDailyTimePickerEvent({ platform: 'ios', eventType: 'dismissed' }).action,
      'ignore',
    );
    const stillSaved = { ...saved };
    assert.equal(stillSaved.dailyHour, 17);
    assert.equal(stillSaved.dailyMinute, 45);
    assert.equal(shouldRefreshStoredPreferencesWhilePickerOpen(true), false);
    assert.equal(shouldRefreshStoredPreferencesWhilePickerOpen(false), true);
  });

  it('keeps 08:05 after local save/refetch and never uses UTC getters for the preference', () => {
    const now = new Date(2026, 7, 26, 12, 0, 0);
    const draft = localTimeDateFromHourMinute(8, 5, now);
    assert.equal(draft.getHours(), 8);
    assert.equal(draft.getMinutes(), 5);
    assert.equal(draft.getSeconds(), 0);

    const committed = commitDailyTimeDraft(saved, draft);
    assert.equal(formatNotificationTime(committed.dailyHour, committed.dailyMinute), '08:05');

    const stored = serializeNotificationPreferences(committed);
    const refetched = parseNotificationPreferences(stored);
    assert.equal(refetched.dailyHour, 8);
    assert.equal(refetched.dailyMinute, 5);

    const rebuilt = localTimeDateFromHourMinute(refetched.dailyHour, refetched.dailyMinute, now);
    assert.deepEqual(localHourMinuteFromDate(rebuilt), { hour: 8, minute: 5 });
    assert.equal(rebuilt.getHours(), 8);
    assert.equal(rebuilt.getMinutes(), 5);
  });

  it('uses the supported dark iOS picker theme', () => {
    assert.equal(IOS_DAILY_TIME_PICKER_THEME.themeVariant, 'dark');
  });
});

describe('Daily Focus notification plan', () => {
  it('schedules a local repeating daily trigger at the selected time', () => {
    setActiveLocale('sv');
    const plan = planDailyFocusNotification({
      dailyEnabled: true,
      dailyHour: 9,
      dailyMinute: 30,
      weeklyEnabled: false,
    });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.triggerType, 'daily');
      assert.equal(plan.hour, 9);
      assert.equal(plan.minute, 30);
      assert.equal(plan.title, 'NORDYAN Coach');
      assert.equal(plan.body, 'Kom ihåg att checka dagens fokus.');
      assert.deepEqual(plan.data, { type: 'daily-focus' });
      assertApprovedNotificationCopy(plan.title, plan.body);
    }
  });

  it('cancels the Daily reminder when disabled', () => {
    const plan = planDailyFocusNotification(DEFAULT_NOTIFICATION_PREFERENCES);
    assert.deepEqual(plan, { action: 'cancel', identifier: 'nordyan-daily-focus' });
  });

  it('localizes Daily copy in Bokmål', () => {
    setActiveLocale('nb');
    const plan = planDailyFocusNotification({
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      dailyEnabled: true,
    });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.title, 'NORDYAN Coach');
      assert.equal(plan.body, 'Husk å sjekke dagens fokus.');
      assertApprovedNotificationCopy(plan.title, plan.body);
    }
  });
});

describe('Weekly Check-in notification plan', () => {
  const available = { status: 'available' as const, weekStartDate: '2026-08-24' };

  it('schedules a one-shot Date trigger for Sunday 18:00 when available', () => {
    setActiveLocale('sv');
    const now = new Date(2026, 7, 26, 10, 0, 0);
    const plan = planWeeklyCheckInNotification({ enabled: true, status: available, now });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.triggerType, 'date');
      assert.equal(plan.date.getTime(), new Date(2026, 7, 30, 18, 0, 0).getTime());
      assert.equal(plan.title, 'NORDYAN Coach');
      assert.equal(plan.body, 'Hur har din vecka varit? Dags för en snabb veckokoll.');
      assert.deepEqual(plan.data, { type: 'weekly-check-in' });
      assert.notEqual(plan.triggerType, 'weekly');
      assertApprovedNotificationCopy(plan.title, plan.body);
    }
  });

  it('falls back to tomorrow 18:00 when Sunday 18:00 has passed', () => {
    const now = new Date(2026, 7, 30, 19, 0, 0);
    assert.equal(
      getWeeklyCheckInReminderDate(now).getTime(),
      new Date(2026, 7, 31, 18, 0, 0).getTime(),
    );
    const plan = planWeeklyCheckInNotification({ enabled: true, status: available, now });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.date.getTime(), new Date(2026, 7, 31, 18, 0, 0).getTime());
    }
  });

  it('cancels when completed, suppressed, unavailable, or disabled', () => {
    const now = new Date(2026, 7, 26, 10, 0, 0);
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'completed', weekStartDate: '2026-08-24' },
        now,
      }).action,
      'cancel',
    );
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'suppressed', weekStartDate: '2026-08-24' },
        now,
      }).action,
      'cancel',
    );
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'unavailable' },
        now,
      }).action,
      'cancel',
    );
    assert.equal(
      planWeeklyCheckInNotification({ enabled: false, status: available, now }).action,
      'cancel',
    );
  });

  it('localizes Weekly copy in Bokmål', () => {
    setActiveLocale('nb');
    const plan = planWeeklyCheckInNotification({
      enabled: true,
      status: available,
      now: new Date(2026, 7, 26, 10, 0, 0),
    });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.title, 'NORDYAN Coach');
      assert.equal(plan.body, 'Hvordan har uken din vært? På tide med en rask ukessjekk.');
      assertApprovedNotificationCopy(plan.title, plan.body);
    }
  });

  it('appends the measurement-due sentence without changing type or eligibility', () => {
    setActiveLocale('sv');
    const now = new Date(2026, 7, 26, 10, 0, 0);
    const plan = planWeeklyCheckInNotification({
      enabled: true,
      status: available,
      now,
      measurementDue: true,
    });
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.title, 'NORDYAN Coach');
      assert.equal(
        plan.body,
        'Hur har din vecka varit? Dags för en snabb veckokoll. Det kan också vara dags för en ny mätning.',
      );
      assert.deepEqual(plan.data, { type: 'weekly-check-in' });
      assertApprovedNotificationCopy(plan.title, plan.body);
    }

    setActiveLocale('nb');
    const nbPlan = planWeeklyCheckInNotification({
      enabled: true,
      status: available,
      now,
      measurementDue: true,
    });
    assert.equal(nbPlan.action, 'schedule');
    if (nbPlan.action === 'schedule') {
      assert.equal(nbPlan.title, 'NORDYAN Coach');
      assert.equal(
        nbPlan.body,
        'Hvordan har uken din vært? På tide med en rask ukessjekk. Det kan också være på tide med en ny måling.',
      );
      assert.deepEqual(nbPlan.data, { type: 'weekly-check-in' });
      assertApprovedNotificationCopy(nbPlan.title, nbPlan.body);
    }
  });

  it('does not schedule when measurement is due but Weekly status is not available', () => {
    const now = new Date(2026, 7, 26, 10, 0, 0);
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'completed', weekStartDate: '2026-08-24' },
        now,
        measurementDue: true,
      }).action,
      'cancel',
    );
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'suppressed', weekStartDate: '2026-08-24' },
        now,
        measurementDue: true,
      }).action,
      'cancel',
    );
    assert.equal(
      planWeeklyCheckInNotification({
        enabled: true,
        status: { status: 'unavailable' },
        now,
        measurementDue: true,
      }).action,
      'cancel',
    );
  });
});

describe('Weekly measurement-due copy helper', () => {
  it('treats missing history, fetch failure, 13 days, and future dates as not due', () => {
    assert.equal(isWeeklyMeasurementDue(undefined, '2026-09-23'), false);
    assert.equal(isWeeklyMeasurementDue(null, '2026-09-23'), false);
    assert.equal(weeklyMeasurementDueFromHistoryResult({ ok: true, value: [] }), false);
    assert.equal(weeklyMeasurementDueFromHistoryResult({ ok: false }), false);
    assert.equal(calendarDaysSinceMeasuredAt('2026-09-10', '2026-09-23'), 13);
    assert.equal(isWeeklyMeasurementDue('2026-09-10', '2026-09-23'), false);
    assert.equal(isWeeklyMeasurementDue('2026-09-24', '2026-09-23'), false);
    assert.equal(calendarDaysSinceMeasuredAt('2026-09-24', '2026-09-23'), -1);
  });

  it('marks 14 and 15+ local calendar days as due', () => {
    assert.equal(calendarDaysSinceMeasuredAt('2026-09-09', '2026-09-23'), 14);
    assert.equal(isWeeklyMeasurementDue('2026-09-09', '2026-09-23'), true);
    assert.equal(calendarDaysSinceMeasuredAt('2026-09-08', '2026-09-23'), 15);
    assert.equal(isWeeklyMeasurementDue('2026-09-08', '2026-09-23'), true);
    assert.equal(
      weeklyMeasurementDueFromHistoryResult({
        ok: true,
        value: [{ measuredAt: '2026-09-09' }],
      }),
      true,
    );
  });

  it('still schedules normal Weekly copy when measurement history cannot be loaded', () => {
    setActiveLocale('sv');
    const measurementDue = weeklyMeasurementDueFromHistoryResult({ ok: false });
    const plan = planWeeklyCheckInNotification({
      enabled: true,
      status: { status: 'available', weekStartDate: '2026-08-24' },
      now: new Date(2026, 7, 26, 10, 0, 0),
      measurementDue,
    });
    assert.equal(measurementDue, false);
    assert.equal(plan.action, 'schedule');
    if (plan.action === 'schedule') {
      assert.equal(plan.body, 'Hur har din vecka varit? Dags för en snabb veckokoll.');
      assert.deepEqual(plan.data, { type: 'weekly-check-in' });
    }
  });

  it('allows only the approved NORDYAN Coach title, not arbitrary Coach copy', () => {
    setActiveLocale('sv');
    const copy = weeklyCheckInReminderCopy();
    assert.equal(copy.title, APPROVED_NOTIFICATION_TITLE);
    assert.doesNotMatch(copy.body, HEALTH_OR_PII);
    assert.match('Ask Coach about your Health Score', HEALTH_OR_PII);
    assert.match('weeklyFocus leaked', HEALTH_OR_PII);
    assert.match('user_id=abc', HEALTH_OR_PII);
  });
});

describe('notification tap and permission helpers', () => {
  it('routes both reminder types to Home and never to Weekly Check-in', () => {
    assert.equal(isNordyanReminderData({ type: 'daily-focus' }), true);
    assert.equal(isNordyanReminderData({ type: 'weekly-check-in' }), true);
    assert.equal(isNordyanReminderData({ type: 'coach' }), false);
    assert.equal(homeRouteForNotificationTap(), '/(tabs)/home');
    assert.notEqual(homeRouteForNotificationTap(), '/weekly-check-in');
  });

  it('does not navigate from a notification before auth is ready', () => {
    assert.equal(
      decideNotificationResponseNavigation({
        authReady: false,
        isAuthenticated: false,
        userId: null,
        data: { type: 'daily-focus' },
      }),
      'wait',
    );
  });

  it('does not force Home when auth is ready without a session', () => {
    assert.equal(
      decideNotificationResponseNavigation({
        authReady: true,
        isAuthenticated: false,
        userId: null,
        data: { type: 'weekly-check-in' },
      }),
      'ignore',
    );
  });

  it('evaluates the app gate only for an authenticated user', () => {
    assert.equal(
      decideNotificationResponseNavigation({
        authReady: true,
        isAuthenticated: true,
        userId: 'user-1',
        data: { type: 'daily-focus' },
      }),
      'evaluate-gate',
    );
    assert.equal(mayOpenHomeForGateDestination('home'), true);
    assert.equal(mayOpenHomeForGateDestination('authenticated-health-data-consent'), false);
    assert.equal(mayOpenHomeForGateDestination('onboarding'), false);
    assert.equal(mayOpenHomeForGateDestination('onboarding-step-4'), false);
    assert.equal(mayOpenHomeForGateDestination('loading'), false);
  });

  it('consumes a notification response identifier only once', () => {
    assert.equal(markNotificationResponseConsumed('nordyan-daily-focus'), true);
    assert.equal(markNotificationResponseConsumed('nordyan-daily-focus'), false);
    assert.equal(markNotificationResponseConsumed('nordyan-weekly-check-in'), true);
  });

  it('does not throw on null, undefined, or empty/whitespace identifiers', () => {
    assert.equal(markNotificationResponseConsumed(null), false);
    assert.equal(markNotificationResponseConsumed(undefined), false);
    assert.equal(markNotificationResponseConsumed(123 as unknown as string), false);
    assert.equal(markNotificationResponseConsumed(''), false);
    assert.equal(markNotificationResponseConsumed('   '), false);
  });

  it('still marks a valid identifier consumed after invalid no-ops', () => {
    assert.equal(markNotificationResponseConsumed(null), false);
    assert.equal(markNotificationResponseConsumed('nordyan-daily-focus'), true);
    assert.equal(markNotificationResponseConsumed('nordyan-daily-focus'), false);
  });

  it('keeps a denied permission from enabling the toggle', () => {
    assert.equal(toggleEnabledAfterPermission(true, 'denied'), false);
    assert.equal(toggleEnabledAfterPermission(true, 'undetermined'), false);
    assert.equal(toggleEnabledAfterPermission(true, 'granted'), true);
    assert.equal(interpretNotificationPermission({ granted: false, status: 'undetermined' }), 'undetermined');
    assert.equal(interpretNotificationPermission({ granted: false, status: 'denied' }), 'denied');
    assert.equal(interpretNotificationPermission({ granted: true, status: 'granted' }), 'granted');
    assert.equal(interpretNotificationPermission({ granted: false, iosStatus: 3 }), 'granted');
  });
});

describe('notification schedule hydration vs account switch', () => {
  it('restores schedules on null -> userId hydration without cancelling as a switch', () => {
    const first = decideNotificationScheduleSync({
      authReady: true,
      previousUserId: undefined,
      nextUserId: 'user-a',
      localeChanged: false,
    });
    assert.deepEqual(first, { kind: 'hydrate-restore', userId: 'user-a' });
  });

  it('does not treat cold-start logged-out hydration as logout', () => {
    assert.deepEqual(
      decideNotificationScheduleSync({
        authReady: true,
        previousUserId: undefined,
        nextUserId: null,
        localeChanged: false,
      }),
      { kind: 'hydrate-idle' },
    );
  });

  it('cancels then restores on a real A -> B switch', () => {
    assert.deepEqual(
      decideNotificationScheduleSync({
        authReady: true,
        previousUserId: 'user-a',
        nextUserId: 'user-b',
        localeChanged: false,
      }),
      { kind: 'switch-cancel-restore', userId: 'user-b' },
    );
  });

  it('cancels schedules on logout after a hydrated user', () => {
    assert.deepEqual(
      decideNotificationScheduleSync({
        authReady: true,
        previousUserId: 'user-a',
        nextUserId: null,
        localeChanged: false,
      }),
      { kind: 'logout-cancel' },
    );
  });
});
