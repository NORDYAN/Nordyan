import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AccentLine,
  HomeIndicator,
  OnboardingMountainBackground,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { colors, onboardingLayout, typography } from '@/theme';

export default function OnboardingIntroScreen() {
  const handleGetStarted = () => {
    router.push(routes.onboardingStep2);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.centerBrand}>
            <View style={styles.brandMarkGroup}>
              <Image
                source={require('../../assets/logos/nordyan-logo-transparent-final.png')}
                style={styles.mountainLogo}
                resizeMode="contain"
                accessibilityLabel="NORDYAN mountain mark"
              />
              <View style={styles.brandLogoContainer}>
                <Text style={styles.brandLogo}>NORDYAN</Text>
              </View>
            </View>
            <AccentLine />
            <Text style={styles.subtext}>
              {'Förstå din hälsa.\nEtt bättre beslut varje dag.'}
            </Text>
          </View>

          <View style={styles.footer}>
            <Button
              label="Kom igång"
              variant="onboarding"
              style={styles.button}
              onPress={handleGetStarted}
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
  centerBrand: {
    alignItems: 'center',
    gap: onboardingLayout.brandSectionGap,
    paddingTop: onboardingLayout.brandSectionPaddingTop,
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  brandMarkGroup: {
    alignItems: 'center',
  },
  mountainLogo: {
    width: 190,
    height: 90,
    alignSelf: 'center',
    marginBottom: 10,
  },
  brandLogoContainer: {
    minHeight: onboardingLayout.brandLogoMinHeight,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'visible',
  },
  brandLogo: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.brand,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: onboardingLayout.brandLogoLineHeight,
    textAlign: 'center',
    includeFontPadding: false,
  },
  subtext: {
    color: colors.onboardingTextMuted,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.light,
    lineHeight: typography.fontSize.lg * typography.lineHeight.relaxed,
    textAlign: 'center',
    width: '100%',
  },
  footer: {
    gap: onboardingLayout.footerGap,
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  button: {
    width: '100%',
  },
});
