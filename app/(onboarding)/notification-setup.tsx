import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingBackHeader, OnboardingMountainBackground } from '@/components/onboarding';
import { DailyFocusReminderHourChoices } from '@/components/profile/DailyFocusReminderHourChoices';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { applyImmediateOnboardingNotificationChoiceForUser } from '@/lib/onboarding/apply-pending-notification-choice.runtime';
import { savePendingNotificationChoice } from '@/lib/onboarding/pending-notification-choice-storage';
import {
  DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR,
  type OnboardingDailyReminderHour,
  type PendingNotificationChoice,
  type PendingNotificationIntent,
} from '@/lib/onboarding/pending-notification-choice';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  getNotificationPermissionState,
  requestNotificationPermission,
} from '@/lib/presentation/notifications/notification-permission.runtime';
import { resolveOnboardingActivatePermission } from '@/lib/presentation/onboarding-notifications/resolve-onboarding-activate-permission';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementChoiceLayout,
  onboardingProfileLayout,
  radii,
  typography,
} from '@/theme';

const NOTIFICATION_SETUP_OVERLAY = 'rgba(18, 20, 22, 0.8)';

export default function OnboardingNotificationSetupScreen() {
  useI18n();
  const { status, session } = useAuth();
  const userId = status === 'authenticated' ? session?.user.id?.trim() || null : null;
  const [busy, setBusy] = useState(false);
  const [dailyHour, setDailyHour] = useState<OnboardingDailyReminderHour>(
    DEFAULT_ONBOARDING_DAILY_REMINDER_HOUR,
  );

  const completeChoice = useCallback(
    async (choice: PendingNotificationChoice) => {
      const intent: PendingNotificationIntent =
        choice === 'enabled'
          ? { choice: 'enabled', dailyHour }
          : { choice: 'skipped' };
      if (userId) {
        await applyImmediateOnboardingNotificationChoiceForUser(userId, intent);
      } else {
        await savePendingNotificationChoice(intent);
      }
      router.push(routes.onboardingMeasurementChoice);
    },
    [dailyHour, userId],
  );

  const handleActivate = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      const choice = await resolveOnboardingActivatePermission({
        getState: getNotificationPermissionState,
        request: requestNotificationPermission,
      });
      await completeChoice(choice);
    } catch {
      await completeChoice('skipped');
    } finally {
      setBusy(false);
    }
  }, [busy, completeChoice]);

  const handleSkip = useCallback(async () => {
    if (busy) {
      return;
    }

    setBusy(true);
    try {
      await completeChoice('skipped');
    } finally {
      setBusy(false);
    }
  }, [busy, completeChoice]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={NOTIFICATION_SETUP_OVERLAY} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingBackHeader step="profile" />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          bounces
        >
          <View style={styles.mainBody}>
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.1}>
              {t('onboarding.notifications.title')}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.15}>
              {t('onboarding.notifications.body')}
            </Text>
          </View>

          <View style={styles.footer}>
            <View style={styles.timeBlock}>
              <Text style={styles.timePrompt} maxFontSizeMultiplier={1.15}>
                {t('onboarding.notifications.timePrompt')}
              </Text>
              <DailyFocusReminderHourChoices
                selectedHour={dailyHour}
                disabled={busy}
                onSelect={setDailyHour}
              />
              <Text style={styles.timeHint} maxFontSizeMultiplier={1.15}>
                {t('onboarding.notifications.weeklyHint')}
              </Text>
            </View>
            <Button
              label={t('onboarding.notifications.activate')}
              variant="onboarding"
              style={styles.primaryButton}
              disabled={busy}
              onPress={() => {
                void handleActivate();
              }}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.notifications.notNow')}
              disabled={busy}
              onPress={() => {
                void handleSkip();
              }}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            >
              <Text style={styles.secondaryButtonLabel}>{t('onboarding.notifications.notNow')}</Text>
            </Pressable>
            <Text style={styles.laterHint} maxFontSizeMultiplier={1.15}>
              {t('onboarding.notifications.laterHint')}
            </Text>
            <HomeIndicator />
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.onboardingBackground,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingBottom: onboardingLayout.contentPaddingBottom + onboardingProfileLayout.scrollBottomPadding,
  },
  mainBody: {
    paddingTop: onboardingMeasurementChoiceLayout.contentPaddingTop,
    paddingHorizontal: onboardingLayout.horizontalPadding,
    gap: onboardingMeasurementChoiceLayout.bodyGap,
  },
  title: {
    color: colors.onboardingText,
    fontSize: onboardingMeasurementChoiceLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight:
      onboardingMeasurementChoiceLayout.titleFontSize * typography.lineHeight.tight,
  },
  body: {
    color: colors.onboardingTextMuted,
    fontSize: onboardingMeasurementChoiceLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      onboardingMeasurementChoiceLayout.subtitleFontSize * typography.lineHeight.relaxed,
    width: '100%',
  },
  footer: {
    gap: onboardingMeasurementChoiceLayout.actionsGap,
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  timeBlock: {
    gap: onboardingMeasurementChoiceLayout.bodyGap,
  },
  timePrompt: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  timeHint: {
    color: colors.onboardingTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
  },
  secondaryButton: {
    minHeight: onboardingMeasurementChoiceLayout.secondaryButtonMinHeight,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.onboardingAccent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonLabel: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  laterHint: {
    color: colors.onboardingTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
});
