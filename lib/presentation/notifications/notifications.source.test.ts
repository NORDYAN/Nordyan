import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Push Notifications v1 source contracts', () => {
  it('uses local schedules only, with permission from the enable flow', () => {
    const appJson = source('app.json');
    const index = source('app/index.tsx');
    const home = source('app/(tabs)/home.tsx');
    const providers = source('providers/app-providers.tsx');
    const lifecycle = source('lib/presentation/notifications/NotificationLifecycle.tsx');
    const screen = source('app/(tabs)/profile/notifications.tsx');
    const runtime = source('lib/presentation/notifications/nordyan-notifications.runtime.ts');
    const permissionRuntime = source(
      'lib/presentation/notifications/notification-permission.runtime.ts',
    );
    const sync = source('lib/presentation/notifications/sync-nordyan-notifications.runtime.ts');
    const auth = source('providers/auth-provider.tsx');
    const deleteRuntime = source('lib/services/account-delete/clear-account-local-data.runtime.ts');
    const layout = source('app/(tabs)/profile/_layout.tsx');
    const routes = source('constants/routes.ts');
    const weeklyHook = source('lib/hooks/weekly-check-in/useWeeklyCheckIn.ts');

    assert.match(appJson, /expo-notifications/);
    assert.match(appJson, /enableBackgroundRemoteNotifications": false/);
    assert.doesNotMatch(appJson, /google-services|UIBackgroundModes|remote-notification/);

    assert.doesNotMatch(index, /expo-notifications|requestPermissionsAsync|getExpoPushTokenAsync/);
    assert.doesNotMatch(home, /Notifications|expo-notifications/);
    assert.match(providers, /NotificationLifecycle/);
    assert.match(providers, /LocaleKeyedSubtree/);
    const lifecycleIndex = providers.indexOf('<NotificationLifecycle');
    const keyedIndex = providers.indexOf('<LocaleKeyedSubtree>');
    assert.equal(lifecycleIndex > 0 && keyedIndex > lifecycleIndex, true);

    assert.doesNotMatch(lifecycle, /requestPermissionsAsync|getExpoPushTokenAsync/);
    assert.match(lifecycle, /decideNotificationResponseNavigation/);
    assert.match(lifecycle, /resolveAppGate/);
    assert.match(lifecycle, /mayOpenHomeForGateDestination/);
    assert.match(lifecycle, /markNotificationResponseConsumed/);
    assert.match(lifecycle, /processResponse\(last\)/);
    assert.match(lifecycle, /processResponse\(response\)/);
    assert.match(lifecycle, /processResponse\(pending\)/);
    assert.match(lifecycle, /getLastNotificationResponse/);
    assert.match(lifecycle, /addNotificationResponseReceivedListener/);
    assert.match(
      source('lib/presentation/notifications/notification-response-consume.ts'),
      /typeof identifier !== 'string'/,
    );
    assert.match(lifecycle, /decideNotificationScheduleSync/);
    assert.match(lifecycle, /hydrate-restore|login-restore/);
    assert.match(lifecycle, /switch-cancel-restore/);
    assert.match(lifecycle, /router\.replace\(homeRouteForNotificationTap\(\)\)/);
    assert.doesNotMatch(lifecycle, /routes\.weeklyCheckIn|\/weekly-check-in/);
    assert.match(lifecycle, /cancelNordyanScheduledNotifications/);
    assert.match(lifecycle, /restoreNordyanNotificationSchedules/);
    assert.match(lifecycle, /AppState/);

    const i18n = source('lib/i18n/I18nProvider.tsx');
    assert.match(i18n, /export function LocaleKeyedSubtree/);
    assert.doesNotMatch(i18n, /<Fragment key=\{locale\}>\{children\}<\/Fragment>\s*<\/I18nContext\.Provider>/);

    assert.match(screen, /requestNotificationPermission/);
    assert.match(screen, /toggleEnabledAfterPermission/);
    assert.match(screen, /Linking\.openSettings/);
    assert.match(screen, /isNativeNotificationsSupported/);
    assert.match(screen, /profile\.notifications\.unsupported/);
    assert.doesNotMatch(screen, /getExpoPushTokenAsync/);

    assert.match(permissionRuntime, /requestPermissionsAsync/);
    assert.doesNotMatch(permissionRuntime, /getExpoPushTokenAsync/);

    assert.match(runtime, /SchedulableTriggerInputTypes\.DAILY/);
    assert.match(runtime, /SchedulableTriggerInputTypes\.DATE/);
    assert.doesNotMatch(runtime, /SchedulableTriggerInputTypes\.WEEKLY/);
    assert.doesNotMatch(runtime, /getExpoPushTokenAsync|getDevicePushTokenAsync/);
    assert.match(runtime, /NORDYAN_REMINDER_CHANNEL_ID/);
    assert.match(source('lib/presentation/notifications/notification-preferences.ts'), /nordyan-reminders/);

    assert.match(sync, /resolveHomeWeeklyCheckInStatus/);
    assert.doesNotMatch(sync, /getExpoPushTokenAsync|supabase\.from\('notifications'\)/);

    assert.match(auth, /cancelNordyanScheduledNotifications/);
    assert.match(deleteRuntime, /cancelNordyanScheduledNotifications/);
    assert.match(deleteRuntime, /clearAccountLocalData/);

    assert.match(layout, /name="notifications"/);
    assert.match(routes, /profileNotifications: '\/\(tabs\)\/profile\/notifications'/);

    assert.match(weeklyHook, /syncWeeklyCheckInReminderForUser/);
    assert.doesNotMatch(weeklyHook, /saveCurrentWeek\(/);
  });

  it('commits Daily time from a local iOS draft on Klar with a dark spinner', () => {
    const screen = source('app/(tabs)/profile/notifications.tsx');
    const picker = source('lib/presentation/notifications/notification-time-picker.ts');
    const lifecycle = source('lib/presentation/notifications/NotificationLifecycle.tsx');
    const permission = source('lib/presentation/notifications/notification-permission.ts');
    const runtime = source('lib/presentation/notifications/nordyan-notifications.runtime.ts');
    const dailyPlan = source('lib/presentation/notifications/daily-focus-schedule.ts');

    assert.match(screen, /openTimePicker/);
    assert.match(screen, /handleTimeConfirm/);
    assert.match(screen, /commitDailyTimeDraft/);
    assert.match(screen, /themeVariant=\{IOS_DAILY_TIME_PICKER_THEME\.themeVariant\}/);
    assert.match(picker, /themeVariant: 'dark'/);
    assert.match(picker, /date\.getHours\(\)/);
    assert.match(picker, /date\.getMinutes\(\)/);
    assert.doesNotMatch(picker, /getUTCHours|getUTCMinutes|Date\.UTC/);
    assert.doesNotMatch(screen, /getUTCHours|getUTCMinutes|Date\.UTC/);
    assert.match(picker, /action: 'remember-selection'/);
    assert.match(picker, /beginIosDailyTimePickerSession/);
    assert.match(picker, /applyIosDailyTimePickerWheelEvent/);
    assert.match(picker, /export function shouldRebindIosPickerValueOnSet/);
    assert.match(picker, /return false;/);
    assert.match(screen, /beginIosDailyTimePickerSession/);
    assert.match(screen, /iosPickerSessionRef/);
    assert.match(screen, /setTimeDraft\(session\.pickerValue\)/);
    assert.match(screen, /action === 'remember-selection'/);
    const rememberBlock = screen.slice(
      screen.indexOf("if (decision.action === 'remember-selection')"),
      screen.indexOf("if (decision.action === 'dismiss')"),
    );
    assert.match(rememberBlock, /applyIosDailyTimePickerWheelEvent/);
    assert.doesNotMatch(rememberBlock, /setTimeDraft/);
    assert.doesNotMatch(rememberBlock, /saveDailyTime|persist\(/);
    assert.match(
      screen.slice(screen.indexOf('const handleTimeConfirm'), screen.indexOf('const timeLabel')),
      /resolveIosDailyTimePickerCommit/,
    );
    assert.match(
      screen.slice(screen.indexOf('const handleTimeConfirm'), screen.indexOf('const timeLabel')),
      /saveDailyTime\(next\)/,
    );

    assert.match(lifecycle, /decideNotificationScheduleSync/);
    assert.doesNotMatch(lifecycle, /commitDailyTimeDraft|timeDraft|themeVariant/);
    assert.doesNotMatch(permission, /commitDailyTimeDraft|DateTimePicker/);
    assert.match(runtime, /DAILY_FOCUS_NOTIFICATION_ID/);
    assert.match(dailyPlan, /identifier: DAILY_FOCUS_NOTIFICATION_ID/);
    assert.doesNotMatch(source('providers/auth-provider.tsx'), /commitDailyTimeDraft|DateTimePicker/);
    assert.doesNotMatch(source('lib/onboarding/resolve-app-gate.ts'), /commitDailyTimeDraft|DateTimePicker/);
  });
});
