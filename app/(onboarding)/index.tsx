import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { NordyanMountainLogo } from '@/components/branding/NordyanMountainLogo';
import {
  AccentLine,
  HomeIndicator,
  OnboardingMountainBackground,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { startNewAnonymousOnboarding } from '@/lib/onboarding/pending-onboarding-ownership';
import { colors, onboardingLayout, typography } from '@/theme';

/** Figma 199:55 composition, with the established NORDYAN mountain mark restored. */
const BRAND_WORDMARK_SIZE = 40;
const BRAND_WORDMARK_LINE_HEIGHT = 48;
const BRAND_TAGLINE_SIZE = 18;
const BRAND_TAGLINE_LINE_HEIGHT = 29;
const BRAND_CLUSTER_GAP = 24;
const HORIZONTAL_PADDING = 32;
const FOOTER_GAP = 20;
const HERO_PADDING_TOP = 56;
const MOUNTAIN_MARK_WIDTH = onboardingLayout.brandMarkWidth;
const MOUNTAIN_MARK_HEIGHT = onboardingLayout.brandMarkHeight;
const MARK_TO_WORDMARK_GAP = onboardingLayout.brandMarkGap;

export default function OnboardingIntroScreen() {
  useI18n();
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const handleGetStarted = async () => {
    if (isStarting) {
      return;
    }

    setIsStarting(true);
    setStartError(null);
    try {
      await startNewAnonymousOnboarding();
      router.push(routes.onboardingStep2);
    } catch {
      setStartError(t('onboarding.startError'));
    } finally {
      setIsStarting(false);
    }
  };

  const handleSignIn = () => {
    router.push(routes.authSignIn);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.stage}>
          <View style={styles.hero}>
            <View style={styles.markAndWordmark}>
              <NordyanMountainLogo
                width={MOUNTAIN_MARK_WIDTH}
                height={MOUNTAIN_MARK_HEIGHT}
              />
              <Text style={styles.wordmark} maxFontSizeMultiplier={1.05}>
                NORDYAN
              </Text>
            </View>
            <AccentLine />
            <Text style={styles.tagline} maxFontSizeMultiplier={1.1}>
              {t('onboarding.hero')}
            </Text>
          </View>

          <View style={styles.footer}>
            {startError ? (
              <Text style={styles.startError} accessibilityLiveRegion="polite">
                {startError}
              </Text>
            ) : null}
            <Button
              label={t('onboarding.getStarted')}
              variant="onboarding"
              style={styles.button}
              disabled={isStarting}
              onPress={() => void handleGetStarted()}
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('onboarding.logIn')}
              onPress={handleSignIn}
              style={({ pressed }) => [styles.signInButton, pressed && styles.signInButtonPressed]}
            >
              <Text style={styles.signInLabel}>{t('onboarding.logIn')}</Text>
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
  stage: {
    flex: 1,
    justifyContent: 'space-between',
  },
  hero: {
    alignItems: 'center',
    paddingTop: HERO_PADDING_TOP,
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: BRAND_CLUSTER_GAP,
  },
  markAndWordmark: {
    alignItems: 'center',
    gap: MARK_TO_WORDMARK_GAP,
  },
  wordmark: {
    color: colors.onboardingText,
    fontSize: BRAND_WORDMARK_SIZE,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: BRAND_WORDMARK_LINE_HEIGHT,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tagline: {
    color: colors.onboardingTextMuted,
    fontSize: BRAND_TAGLINE_SIZE,
    fontWeight: typography.fontWeight.light,
    lineHeight: BRAND_TAGLINE_LINE_HEIGHT,
    textAlign: 'center',
    width: '100%',
    includeFontPadding: false,
  },
  footer: {
    width: '100%',
    gap: FOOTER_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  button: {
    width: '100%',
  },
  startError: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  signInButton: {
    alignSelf: 'center',
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  signInButtonPressed: {
    opacity: 0.75,
  },
  signInLabel: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
