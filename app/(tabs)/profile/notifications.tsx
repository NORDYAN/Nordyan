import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { DailyFocusReminderHourChoices } from '@/components/profile/DailyFocusReminderHourChoices';
import { ProfileSettingsCard, ProfileSettingsDivider } from '@/components/profile';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  resolveOnboardingDailyReminderHour,
  type OnboardingDailyReminderHour,
} from '@/lib/onboarding/pending-notification-choice';
import { planDailyFocusNotification } from '@/lib/presentation/notifications/daily-focus-schedule';
import { getNotificationPermissionState, requestNotificationPermission } from '@/lib/presentation/notifications/notification-permission.runtime';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationPreferences,
} from '@/lib/presentation/notifications/notification-preferences';
import { notificationPreferencesStore } from '@/lib/presentation/notifications/notification-preferences.storage';
import { applyDailyFocusNotificationPlan } from '@/lib/presentation/notifications/nordyan-notifications.runtime';
import { isNativeNotificationsSupported } from '@/lib/presentation/notifications/notifications-platform';
import { toggleEnabledAfterPermission } from '@/lib/presentation/notifications/notification-permission';
import { syncWeeklyCheckInReminderForUser } from '@/lib/presentation/notifications/sync-nordyan-notifications.runtime';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  profileHealthProfileLayout,
  profileLayout,
  profileTypography,
  typography,
} from '@/theme';

function confirmPermissionExplanation(): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(t('profile.notifications.permissionTitle'), t('profile.notifications.permissionBody'), [
      {
        text: t('common.cancel'),
        style: 'cancel',
        onPress: () => resolve(false),
      },
      {
        text: t('common.continue'),
        onPress: () => resolve(true),
      },
    ]);
  });
}

function showDeniedFeedback(): void {
  Alert.alert(t('profile.notifications.permissionTitle'), t('profile.notifications.denied'), [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('profile.notifications.openSettings'),
      onPress: () => {
        void Linking.openSettings();
      },
    },
  ]);
}

export default function ProfileNotificationsScreen() {
  const { locale } = useI18n();
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const native = isNativeNotificationsSupported();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void notificationPreferencesStore.get(userId).then((next) => {
      if (!cancelled) {
        setPrefs(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = useCallback(
    async (next: NotificationPreferences) => {
      setPrefs(next);
      await notificationPreferencesStore.set(userId, next);
    },
    [userId],
  );

  const saveDailyTime = useCallback(
    async (next: NotificationPreferences) => {
      await persist(next);
      await applyDailyFocusNotificationPlan(planDailyFocusNotification(next));
    },
    [persist],
  );

  const ensurePermissionForEnable = useCallback(async (): Promise<boolean> => {
    const current = await getNotificationPermissionState();
    if (current === 'unsupported') {
      return false;
    }
    if (current === 'granted') {
      return true;
    }
    if (current === 'denied') {
      showDeniedFeedback();
      return false;
    }

    const proceed = await confirmPermissionExplanation();
    if (!proceed) {
      return false;
    }

    const requested = await requestNotificationPermission();
    if (requested !== 'granted') {
      showDeniedFeedback();
      return false;
    }
    return true;
  }, []);

  const handleDailyToggle = useCallback(
    async (enabled: boolean) => {
      if (busy || !native) {
        return;
      }
      setBusy(true);
      try {
        if (!enabled) {
          const next = { ...prefs, dailyEnabled: false };
          await persist(next);
          await applyDailyFocusNotificationPlan(planDailyFocusNotification(next));
          return;
        }

        const allowed = await ensurePermissionForEnable();
        if (!toggleEnabledAfterPermission(true, allowed ? 'granted' : 'denied')) {
          return;
        }

        const next = {
          ...prefs,
          dailyEnabled: true,
          dailyHour: resolveOnboardingDailyReminderHour(prefs.dailyHour),
          dailyMinute: 0,
        };
        await persist(next);
        await applyDailyFocusNotificationPlan(planDailyFocusNotification(next));
      } catch {
        Alert.alert(t('profile.notifications.scheduleFailed'));
        await persist({ ...prefs, dailyEnabled: false });
        await applyDailyFocusNotificationPlan(planDailyFocusNotification({ ...prefs, dailyEnabled: false }));
      } finally {
        setBusy(false);
      }
    },
    [busy, ensurePermissionForEnable, native, persist, prefs],
  );

  const handleWeeklyToggle = useCallback(
    async (enabled: boolean) => {
      if (busy || !native) {
        return;
      }
      setBusy(true);
      try {
        if (!enabled) {
          const next = { ...prefs, weeklyEnabled: false };
          await persist(next);
          await syncWeeklyCheckInReminderForUser(userId, false);
          return;
        }

        const allowed = await ensurePermissionForEnable();
        if (!toggleEnabledAfterPermission(true, allowed ? 'granted' : 'denied')) {
          return;
        }

        const next = { ...prefs, weeklyEnabled: true };
        await persist(next);
        await syncWeeklyCheckInReminderForUser(userId, true);
      } catch {
        Alert.alert(t('profile.notifications.scheduleFailed'));
        await persist({ ...prefs, weeklyEnabled: false });
        await syncWeeklyCheckInReminderForUser(userId, false);
      } finally {
        setBusy(false);
      }
    },
    [busy, ensurePermissionForEnable, native, persist, prefs, userId],
  );

  const handleSelectDailyHour = useCallback(
    (hour: OnboardingDailyReminderHour) => {
      if (busy) {
        return;
      }
      const next = {
        ...prefs,
        dailyHour: hour,
        dailyMinute: 0,
      };
      void saveDailyTime(next).catch(() => {
        Alert.alert(t('profile.notifications.scheduleFailed'));
      });
    },
    [busy, prefs, saveDailyTime],
  );

  const selectedHour = resolveOnboardingDailyReminderHour(prefs.dailyHour);

  return (
    <ScreenContainer variant="profile">
      <StatusBar style="light" />
      <View style={styles.navBar}>
        <OnboardingBackButton onPress={() => router.back()} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('profile.notifications')}</Text>
        <Text style={styles.subtitle}>{t('profile.notifications.intro')}</Text>

        {!native ? (
          <Text style={styles.subtitle}>{t('profile.notifications.unsupported')}</Text>
        ) : (
          <ProfileSettingsCard key={locale}>
            <View style={styles.toggleRow}>
              <Text style={styles.toggleTitle}>{t('profile.notifications.dailyFocus')}</Text>
              <Switch
                value={prefs.dailyEnabled}
                onValueChange={(value) => {
                  void handleDailyToggle(value);
                }}
                disabled={busy}
                trackColor={{ false: colors.homeBorder, true: colors.onboardingAccent }}
                thumbColor={colors.onboardingText}
                accessibilityLabel={t('profile.notifications.dailyFocus')}
              />
            </View>
            {prefs.dailyEnabled ? (
              <>
                <ProfileSettingsDivider />
                <View style={styles.hourBlock}>
                  <Text style={styles.hourLabel}>{t('profile.notifications.time')}</Text>
                  <DailyFocusReminderHourChoices
                    selectedHour={selectedHour}
                    disabled={busy}
                    onSelect={handleSelectDailyHour}
                  />
                </View>
              </>
            ) : null}
            <ProfileSettingsDivider />
            <View style={styles.weeklyBlock}>
              <View style={styles.toggleRow}>
                <Text style={styles.toggleTitle}>{t('profile.notifications.weeklyCheckIn')}</Text>
                <Switch
                  value={prefs.weeklyEnabled}
                  onValueChange={(value) => {
                    void handleWeeklyToggle(value);
                  }}
                  disabled={busy}
                  trackColor={{ false: colors.homeBorder, true: colors.onboardingAccent }}
                  thumbColor={colors.onboardingText}
                  accessibilityLabel={t('profile.notifications.weeklyCheckIn')}
                />
              </View>
              <Text style={styles.weeklyHint}>{t('onboarding.notifications.weeklyHint')}</Text>
            </View>
          </ProfileSettingsCard>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: profileHealthProfileLayout.navBarHeight,
    paddingHorizontal: profileHealthProfileLayout.navBarPaddingHorizontal,
    paddingVertical: profileHealthProfileLayout.navBarPaddingVertical,
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: profileLayout.sectionGap,
    paddingHorizontal: profileLayout.horizontalPadding,
    paddingTop: profileHealthProfileLayout.scrollPaddingTop,
    paddingBottom: profileLayout.scrollBottomPadding,
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileTypography.screenTitleSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: profileTypography.screenTitleSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.rowSubtitleSize,
    fontWeight: typography.fontWeight.regular,
  },
  toggleRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
    paddingVertical: profileLayout.rowPaddingVertical,
    gap: 8,
  },
  toggleTitle: {
    color: colors.onboardingText,
    fontSize: profileTypography.rowTitleSize,
    fontWeight: typography.fontWeight.medium,
    flexShrink: 1,
  },
  hourBlock: {
    gap: 12,
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
    paddingBottom: profileLayout.rowPaddingVertical,
  },
  hourLabel: {
    color: colors.onboardingText,
    fontSize: profileTypography.rowTitleSize,
    fontWeight: typography.fontWeight.medium,
  },
  weeklyBlock: {
    paddingBottom: profileLayout.rowPaddingVertical,
  },
  weeklyHint: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.rowSubtitleSize,
    fontWeight: typography.fontWeight.regular,
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
  },
});
