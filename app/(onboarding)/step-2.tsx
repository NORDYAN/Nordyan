import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingMountainBackground } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { onboardingAssets } from '@/assets/images/onboarding';
import { routes } from '@/constants/routes';
import { colors, onboardingLayout, typography } from '@/theme';

const PROMISE_BODY_LINE_HEIGHT = 1.58;
/** ~12% lighter overlay vs theme token so mountains read clearer on screen 2 only. */
const PROMISE_MOUNTAIN_OVERLAY = 'rgba(18, 20, 22, 0.44)';

const PROMISE_MOUNTAIN_LOGO = require('../../assets/logos/nordyan-logo-transparent-final.png');
const PROMISE_MOUNTAIN_LOGO_WIDTH = 70;
const PROMISE_MOUNTAIN_LOGO_HEIGHT = PROMISE_MOUNTAIN_LOGO_WIDTH * (212 / 440);
const PROMISE_LOGO_TO_OVERLINE_GAP = 16;
const PROMISE_TITLE_FONT_SIZE = typography.fontSize.xxl * 0.95;

export default function OnboardingPromiseScreen() {
  const handleContinue = () => {
    router.push(routes.onboardingStep3);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground
        backgroundSource={onboardingAssets.mountainBackgroundPromise}
        overlayColor={PROMISE_MOUNTAIN_OVERLAY}
        fogEnabled
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.introText}>
            <View style={styles.headerBlock}>
              <Image
                source={PROMISE_MOUNTAIN_LOGO}
                style={styles.mountainLogo}
                resizeMode="contain"
                accessibilityLabel="NORDYAN mountain mark"
              />
              <View style={styles.headlineGroup}>
                <Text style={styles.overline}>VÅRT LÖFTE</Text>
                <Text style={styles.title}>{'Inte ännu en\nhälsoapp'}</Text>
              </View>
            </View>
            <Text style={styles.body}>
              {
                'Vi hjälper dig inte bara att samla data.\nVi hjälper dig att förstå vad den faktiskt betyder för din långsiktiga hälsa, styrka och vitalitet.'
              }
            </Text>
          </View>

          <View style={styles.footer}>
            <Button
              label="Fortsätt"
              variant="onboarding"
              style={styles.button}
              labelStyle={styles.buttonLabel}
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
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: onboardingLayout.contentPaddingBottom,
  },
  introText: {
    paddingTop: onboardingLayout.promiseIntroPaddingTop - 24,
    paddingHorizontal: onboardingLayout.promiseIntroPaddingHorizontal,
    alignItems: 'flex-start',
  },
  headerBlock: {
    alignItems: 'flex-start',
    marginBottom: onboardingLayout.promiseIntroGap,
    width: '100%',
  },
  mountainLogo: {
    width: PROMISE_MOUNTAIN_LOGO_WIDTH,
    height: PROMISE_MOUNTAIN_LOGO_HEIGHT,
    marginBottom: PROMISE_LOGO_TO_OVERLINE_GAP,
    opacity: 1,
  },
  headlineGroup: {
    gap: onboardingLayout.promiseHeaderGap,
    alignItems: 'flex-start',
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
    fontSize: PROMISE_TITLE_FONT_SIZE,
    fontWeight: typography.fontWeight.bold,
    lineHeight: PROMISE_TITLE_FONT_SIZE * typography.lineHeight.tight,
  },
  body: {
    color: colors.onboardingTextMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.lg * PROMISE_BODY_LINE_HEIGHT,
    width: '100%',
  },
  footer: {
    gap: onboardingLayout.footerGap,
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  button: {
    width: '100%',
  },
  buttonLabel: {
    color: colors.onboardingText,
  },
});
