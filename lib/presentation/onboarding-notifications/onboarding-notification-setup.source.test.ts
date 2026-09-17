import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('A6 onboarding notification setup source contracts', () => {
  it('inserts notification-setup between personal profile and measurement choice', () => {
    const step4 = source('app/(onboarding)/step-4.tsx');
    const screen = source('app/(onboarding)/notification-setup.tsx');
    const routes = source('constants/routes.ts');
    const age = source('lib/presentation/age-confirmation/age-confirmation.presentation.ts');
    const consent = source(
      'lib/presentation/health-data-consent/health-data-consent.presentation.ts',
    );

    assert.match(routes, /onboardingNotificationSetup: '\/\(onboarding\)\/notification-setup'/);
    assert.match(step4, /router\.push\(routes\.onboardingNotificationSetup\)/);
    assert.match(step4, /label=\{t\('common\.continue'\)\}/);
    assert.doesNotMatch(step4, /onboarding\.calculateProfile/);
    assert.doesNotMatch(step4, /router\.push\(routes\.onboardingMeasurementChoice\)/);
    assert.match(screen, /router\.push\(routes\.onboardingMeasurementChoice\)/);
    assert.match(screen, /OnboardingBackHeader step="profile"/);
    assert.match(screen, /<ScrollView/);
    assert.ok(screen.indexOf('OnboardingBackHeader step="profile"') < screen.indexOf('<ScrollView'));
    assert.ok(screen.indexOf('<ScrollView') < screen.indexOf("onboarding.notifications.notNow"));
    assert.match(screen, /flexGrow: 1/);
    assert.match(age, /notification-setup/);
    assert.match(consent, /notification-setup/);
  });

  it('does not request permission on open or Inte nu and skips the Profile pre-permission Alert', () => {
    const screen = source('app/(onboarding)/notification-setup.tsx');
    const profile = source('app/(tabs)/profile/notifications.tsx');
    const skip = screen.slice(
      screen.indexOf('const handleSkip'),
      screen.indexOf('return (', screen.indexOf('const handleSkip')),
    );
    const activate = screen.slice(
      screen.indexOf('const handleActivate'),
      screen.indexOf('const handleSkip'),
    );

    assert.doesNotMatch(screen, /useEffect/);
    assert.doesNotMatch(screen, /DateTimePicker|beginIosDailyTimePickerSession|notification-time-picker/);
    assert.match(screen, /DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR/);
    assert.match(screen, /DailyFocusReminderHourChoices/);
    assert.doesNotMatch(screen, /onboarding\.notifications\.timeLaterHint/);
    assert.match(screen, /onboarding\.notifications\.weeklyHint/);
    assert.match(screen, /onboarding\.notifications\.laterHint/);
    assert.match(screen, /onSelect=\{setDailyHour\}/);
    const hourChoices = screen.slice(
      screen.indexOf('<DailyFocusReminderHourChoices'),
      screen.indexOf("label={t('onboarding.notifications.activate')}"),
    );
    assert.match(hourChoices, /onSelect=\{setDailyHour\}/);
    assert.doesNotMatch(
      hourChoices,
      /requestNotificationPermission|getNotificationPermissionState|savePendingNotificationChoice|resolveOnboardingActivatePermission/,
    );
    assert.doesNotMatch(skip, /requestNotificationPermission|getNotificationPermissionState|resolveOnboardingActivatePermission/);
    assert.match(activate, /resolveOnboardingActivatePermission/);
    assert.match(activate, /request: requestNotificationPermission/);
    assert.doesNotMatch(screen, /Alert\.alert/);
    assert.doesNotMatch(screen, /confirmPermissionExplanation|Linking\.openSettings/);
    assert.match(profile, /confirmPermissionExplanation/);
    assert.match(profile, /Linking\.openSettings/);
  });

  it('keeps Result without Back and leaves auth callback free of notification apply', () => {
    const result = source('app/(onboarding)/step-5.tsx');
    const callback = source('app/auth/callback.tsx');
    const complete = source('lib/presentation/auth-verification/complete-auth-email-callback.ts');
    const baseline = source('lib/onboarding/anonymous-signup-baseline.ts');
    const ownership = source('lib/onboarding/pending-onboarding-ownership.service.ts');
    const picker = source('lib/presentation/notifications/notification-time-picker.ts');
    const permissionRuntime = source(
      'lib/presentation/notifications/notification-permission.runtime.ts',
    );
    const prefs = source('lib/presentation/notifications/notification-preferences.ts');
    const lock = source('lib/services/auth/pkce-provider-operation-lock.ts');
    const pending = source('lib/onboarding/pending-notification-choice.ts');
    const profile = source('app/(tabs)/profile/notifications.tsx');
    const hourChoices = source('components/profile/DailyFocusReminderHourChoices.tsx');

    assert.match(result, /OnboardingMajorProgress step="result"/);
    assert.doesNotMatch(result, /OnboardingBackHeader|OnboardingBackButton/);
    assert.doesNotMatch(callback, /notification|Notification/);
    assert.doesNotMatch(complete, /notification|Notification/);
    assert.doesNotMatch(baseline, /notification/i);
    assert.doesNotMatch(ownership, /notification/i);
    assert.match(picker, /beginIosDailyTimePickerSession/);
    assert.match(permissionRuntime, /requestPermissionsAsync/);
    assert.match(prefs, /WEEKLY_CHECK_IN_REMINDER_HOUR = 18/);
    assert.match(lock, /runPkceProviderOperation|beginPkceProviderOperation/);
    assert.match(pending, /ONBOARDING_DAILY_REMINDER_HOURS = \[7, 8, 9, 16, 17, 18\]/);
    assert.match(pending, /DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR = 8/);
    assert.match(pending, /dailyMinute: 0/);
    assert.match(profile, /DailyFocusReminderHourChoices/);
    assert.match(profile, /saveDailyTime\(next\)/);
    assert.match(profile, /applyDailyFocusNotificationPlan\(planDailyFocusNotification\(next\)\)/);
    assert.doesNotMatch(profile, /DateTimePicker|beginIosDailyTimePickerSession|openTimePicker|handleTimeConfirm/);
    assert.match(hourChoices, /ONBOARDING_DAILY_REMINDER_HOUR_ROWS/);
    assert.match(profile, /onboarding\.notifications\.weeklyHint/);
    assert.doesNotMatch(profile, /openTimePicker|DateTimePicker/);
  });

  it('applies pending choice only at authenticated bootstrap, not existing-account sign-in leak', () => {
    const index = source('app/index.tsx');
    const tabs = source('app/(tabs)/_layout.tsx');
    const ownership = source('lib/onboarding/pending-onboarding-ownership.ts');
    const provider = source('providers/auth-provider.tsx');
    const deletion = source('lib/services/account-delete/clear-account-local-data.ts');

    assert.match(index, /applyPendingNotificationChoiceForAuthenticatedUser\(userId\)/);
    assert.match(tabs, /applyPendingNotificationChoiceForAuthenticatedUser\(session\.user\.id\)/);
    assert.match(ownership, /clearPendingNotificationChoice/);
    const startNew = ownership.slice(
      ownership.indexOf('export async function startNewAnonymousOnboarding'),
      ownership.indexOf('export async function clearCompletedOnboardingLocalData'),
    );
    const existingSignIn = ownership.slice(
      ownership.indexOf('export async function clearUnownedPendingOnboardingForExistingSignIn'),
      ownership.indexOf('export async function startNewAnonymousOnboarding'),
    );
    assert.match(startNew, /clearPendingNotificationChoice/);
    assert.match(existingSignIn, /clearPendingNotificationChoice/);
    assert.match(provider, /clearUnownedPendingOnboardingForExistingSignIn/);
    assert.doesNotMatch(provider, /applyPendingNotificationChoiceForAuthenticatedUser/);
    assert.match(deletion, /PENDING_NOTIFICATION_CHOICE_KEY/);
  });
});
