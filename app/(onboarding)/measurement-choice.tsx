import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingBackHeader, OnboardingMountainBackground } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { emitOnboardingForensics } from '@/lib/onboarding/onboarding-forensics-emit';
import { onboardingResultHref } from '@/lib/onboarding/onboarding-result-navigation';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementChoiceLayout,
  radii,
  typography,
} from '@/theme';

/** Figma: nordyan-onboarding-measurement-choice (design frozen) */
const MEASUREMENT_CHOICE_OVERLAY = 'rgba(18, 20, 22, 0.8)';

export default function OnboardingMeasurementChoiceScreen() {
  useI18n();
  const { status, session } = useAuth();
  const authenticated = status === 'authenticated';
  const viewerUserId = authenticated ? session?.user.id ?? null : null;

  const handleRegisterMeasurements = () => {
    router.push(routes.onboardingBodyMeasurements);
  };

  const handleSkipToHealthScore = () => {
    void (async () => {
      await emitOnboardingForensics({
        event: 'measurement-choice-skip',
        authenticated,
        viewerUserId,
        profileWriteResult: 'not_attempted',
        lifestyleWriteResult: 'not_attempted',
        visitIdPresent: false,
      });
      router.push(onboardingResultHref());
    })();
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={MEASUREMENT_CHOICE_OVERLAY} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <OnboardingBackHeader step="profile" />
        <View style={styles.content}>
          <View style={styles.mainBody}>
            <View style={styles.headerBlock}>
              <Text style={styles.overline}>{t('onboarding.measureChoice.overline')}</Text>
              <Text style={styles.title}>{t('onboarding.measureChoice.title')}</Text>
            </View>

            <Text style={styles.body}>{t('onboarding.measureChoice.body')}</Text>
          </View>

          <View style={styles.footer}>
            <Button
              label={t('onboarding.measureNow')}
              variant="onboarding"
              style={styles.primaryButton}
              onPress={handleRegisterMeasurements}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.continueToScore')}
              onPress={handleSkipToHealthScore}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}
            >
              <Text style={styles.secondaryButtonLabel}>{t('onboarding.continueToScore')}</Text>
            </Pressable>
            <HomeIndicator />
          </View>
        </View>
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: onboardingLayout.contentPaddingBottom,
  },
  mainBody: {
    paddingTop: onboardingMeasurementChoiceLayout.contentPaddingTop,
    paddingHorizontal: onboardingLayout.horizontalPadding,
    gap: onboardingMeasurementChoiceLayout.bodyGap,
  },
  headerBlock: {
    gap: onboardingMeasurementChoiceLayout.headerGap,
    width: '100%',
  },
  overline: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
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
});
