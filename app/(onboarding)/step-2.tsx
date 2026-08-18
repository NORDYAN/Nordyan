import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingMountainBackground } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { onboardingAssets } from '@/assets/images/onboarding';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, typography } from '@/theme';
import { initialLifestyleColors } from '@/theme/initial-lifestyle';

/** Figma 199:77 — nordyan-onboarding-v11-product-value */
const HORIZONTAL_PADDING = 32;
const HEADLINE_GAP = 12;
const SECTION_GAP = 32;
const FOOTER_GAP = 20;
const TITLE_SIZE = 32;
const TITLE_LINE_HEIGHT = 38;
const BODY_SIZE = 18;
const BODY_LINE_HEIGHT = 31;
const OVERLINE_SIZE = 12;

export default function OnboardingProductValueScreen() {
  useI18n();

  const handleContinue = () => {
    router.push(routes.onboardingLifestyleIntro);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground
        backgroundSource={onboardingAssets.mountainBackgroundPromise}
        overlayColor={initialLifestyleColors.productValueOverlay}
        edgeFadeEnabled={false}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.stage}>
          <View style={styles.hero}>
            <View style={styles.headline}>
              <Text style={styles.overline} maxFontSizeMultiplier={1.1}>
                {t('onboarding.step2.overline')}
              </Text>
              <Text style={styles.title} maxFontSizeMultiplier={1.1}>
                {t('onboarding.step2.title')}
              </Text>
            </View>
            <Text style={styles.body} maxFontSizeMultiplier={1.1}>
              {t('onboarding.step2.body')}
            </Text>
          </View>

          <View style={styles.footer}>
            <Button
              label={t('common.continue')}
              variant="onboarding"
              style={styles.button}
              onPress={handleContinue}
            />
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
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: HORIZONTAL_PADDING,
    gap: SECTION_GAP,
  },
  headline: {
    gap: HEADLINE_GAP,
    alignItems: 'flex-start',
    width: '100%',
  },
  overline: {
    color: colors.onboardingAccent,
    fontSize: OVERLINE_SIZE,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  title: {
    color: colors.onboardingText,
    fontSize: TITLE_SIZE,
    fontWeight: typography.fontWeight.bold,
    lineHeight: TITLE_LINE_HEIGHT,
    includeFontPadding: false,
    width: '100%',
  },
  body: {
    color: colors.onboardingTextMuted,
    fontSize: BODY_SIZE,
    fontWeight: typography.fontWeight.regular,
    lineHeight: BODY_LINE_HEIGHT,
    includeFontPadding: false,
    width: '100%',
  },
  footer: {
    width: '100%',
    gap: FOOTER_GAP,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  button: {
    width: '100%',
  },
});
