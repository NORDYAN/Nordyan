import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps, type ComponentType } from 'react';
import {
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProfileSettingsCard, ProfileSettingsDivider, ProfileSettingsRow } from '@/components/profile';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { planDailyFocusNotification } from '@/lib/presentation/notifications/daily-focus-schedule';
import { getNotificationPermissionState, requestNotificationPermission } from '@/lib/presentation/notifications/notification-permission.runtime';
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  formatNotificationTime,
  type NotificationPreferences,
} from '@/lib/presentation/notifications/notification-preferences';
import { notificationPreferencesStore } from '@/lib/presentation/notifications/notification-preferences.storage';
import { applyDailyFocusNotificationPlan } from '@/lib/presentation/notifications/nordyan-notifications.runtime';
import { isNativeNotificationsSupported } from '@/lib/presentation/notifications/notifications-platform';
import { toggleEnabledAfterPermission } from '@/lib/presentation/notifications/notification-permission';
import {
  applyIosDailyTimePickerWheelEvent,
  beginIosDailyTimePickerSession,
  commitDailyTimeDraft,
  decideDailyTimePickerEvent,
  IOS_DAILY_TIME_PICKER_THEME,
  resolveIosDailyTimePickerCommit,
  shouldRefreshStoredPreferencesWhilePickerOpen,
  type IosDailyTimePickerSession,
} from '@/lib/presentation/notifications/notification-time-picker';
import { syncWeeklyCheckInReminderForUser } from '@/lib/presentation/notifications/sync-nordyan-notifications.runtime';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  profileHealthProfileLayout,
  profileLayout,
  profileTypography,
  typography,
} from '@/theme';

type DailyTimePickerProps = ComponentProps<typeof DateTimePicker> & {
  themeVariant?: 'light' | 'dark';
  textColor?: string;
};

const DailyTimePicker = DateTimePicker as ComponentType<DailyTimePickerProps>;

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
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timeDraft, setTimeDraft] = useState<Date | null>(null);
  const [busy, setBusy] = useState(false);
  const pickerOpenRef = useRef(false);
  const iosPickerSessionRef = useRef<IosDailyTimePickerSession | null>(null);

  useEffect(() => {
    let cancelled = false;
    void notificationPreferencesStore.get(userId).then((next) => {
      if (!cancelled && shouldRefreshStoredPreferencesWhilePickerOpen(pickerOpenRef.current)) {
        setPrefs(next);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const closeTimePicker = useCallback(() => {
    pickerOpenRef.current = false;
    iosPickerSessionRef.current = null;
    setShowTimePicker(false);
    setTimeDraft(null);
  }, []);

  const openTimePicker = useCallback(() => {
    const session = beginIosDailyTimePickerSession(prefs.dailyHour, prefs.dailyMinute);
    pickerOpenRef.current = true;
    iosPickerSessionRef.current = session;
    setTimeDraft(session.pickerValue);
    setShowTimePicker(true);
  }, [prefs.dailyHour, prefs.dailyMinute]);

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
          closeTimePicker();
          await persist(next);
          await applyDailyFocusNotificationPlan(planDailyFocusNotification(next));
          return;
        }

        const allowed = await ensurePermissionForEnable();
        if (!toggleEnabledAfterPermission(true, allowed ? 'granted' : 'denied')) {
          return;
        }

        const next = { ...prefs, dailyEnabled: true };
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
    [busy, closeTimePicker, ensurePermissionForEnable, native, persist, prefs],
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

  const handleTimeChange = useCallback((event: DateTimePickerEvent, selected?: Date) => {
    const decision = decideDailyTimePickerEvent({
      platform: Platform.OS === 'ios' ? 'ios' : 'android',
      eventType: event.type,
      selected,
    });

    if (decision.action === 'remember-selection') {
      const session = iosPickerSessionRef.current;
      if (session) {
        iosPickerSessionRef.current = applyIosDailyTimePickerWheelEvent(
          session,
          decision.selection,
        );
      }
      return;
    }

    if (decision.action === 'dismiss') {
      closeTimePicker();
      return;
    }

    if (decision.action === 'commit') {
      const next = {
        ...prefs,
        dailyHour: decision.hour,
        dailyMinute: decision.minute,
      };
      closeTimePicker();
      void saveDailyTime(next).catch(() => {
        Alert.alert(t('profile.notifications.scheduleFailed'));
      });
    }
  }, [closeTimePicker, prefs, saveDailyTime]);

  const handleTimeConfirm = useCallback(() => {
    const session = iosPickerSessionRef.current;
    const selected = session ? resolveIosDailyTimePickerCommit(session) : timeDraft;
    if (!selected) {
      closeTimePicker();
      return;
    }

    const next = commitDailyTimeDraft(prefs, selected);
    closeTimePicker();
    void saveDailyTime(next).catch(() => {
      Alert.alert(t('profile.notifications.scheduleFailed'));
    });
  }, [closeTimePicker, prefs, saveDailyTime, timeDraft]);

  const timeLabel = useMemo(
    () => formatNotificationTime(prefs.dailyHour, prefs.dailyMinute),
    [prefs.dailyHour, prefs.dailyMinute],
  );

  return (
    <ScreenContainer variant="profile">
      <StatusBar style="light" />
      <View style={styles.navBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('common.back')}
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name="chevron-back"
            size={profileHealthProfileLayout.backIconSize}
            color={colors.onboardingText}
          />
        </Pressable>
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
                <ProfileSettingsRow
                  icon="time-outline"
                  title={t('profile.notifications.time')}
                  subtitle={timeLabel}
                  showChevron
                  onPress={openTimePicker}
                  accessibilityLabel={`${t('profile.notifications.time')}, ${timeLabel}`}
                />
              </>
            ) : null}
            {showTimePicker && prefs.dailyEnabled && timeDraft ? (
              <DailyTimePicker
                value={timeDraft}
                mode="time"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                is24Hour
                themeVariant={IOS_DAILY_TIME_PICKER_THEME.themeVariant}
                textColor={colors.onboardingText}
                onChange={handleTimeChange}
              />
            ) : null}
            {showTimePicker && prefs.dailyEnabled && Platform.OS === 'ios' ? (
              <Pressable
                onPress={handleTimeConfirm}
                style={styles.doneButton}
                accessibilityRole="button"
                accessibilityLabel={t('common.done')}
              >
                <Text style={styles.doneLabel}>{t('common.done')}</Text>
              </Pressable>
            ) : null}
            <ProfileSettingsDivider />
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
  backButton: {
    width: profileHealthProfileLayout.backIconSize,
    height: profileHealthProfileLayout.backIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.75,
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
  doneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: profileLayout.rowPaddingHorizontal,
    paddingBottom: profileLayout.rowPaddingVertical,
  },
  doneLabel: {
    color: colors.onboardingAccent,
    fontSize: profileTypography.rowTitleSize,
    fontWeight: typography.fontWeight.medium,
  },
});
