import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingMountainBackground } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { colors, onboardingLayout, typography } from '@/theme';

/** Figma: nordyan-onboarding-3 — design frozen. */
const PERSONALIZATION_MOUNTAIN_OVERLAY = 'rgba(18, 20, 22, 0.8)';
const PERSONALIZATION_INTRO_PADDING_TOP = 80;
const PERSONALIZATION_SECTION_GAP = 40;
const PERSONALIZATION_BODY_LINE_HEIGHT = 1.6;

export default function OnboardingPersonalizationScreen() {
  const handleCreateProfile = () => {
    router.push(routes.onboardingStep4);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={PERSONALIZATION_MOUNTAIN_OVERLAY} />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.content}>
          <View style={styles.mainBody}>
            <View style={styles.headlineBlock}>
              <Text style={styles.title}>Din hälsa. Din resa.</Text>
            </View>

            <Text style={styles.body}>
              NORDYAN använder dina mål, vanor och hälsodata för att ge personliga rekommendationer
              anpassade efter dig.
            </Text>
          </View>

          <View style={styles.footer}>
            <Button
              label="Skapa profil"
              variant="onboarding"
              style={styles.button}
              onPress={handleCreateProfile}
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
  mainBody: {
    paddingTop: PERSONALIZATION_INTRO_PADDING_TOP,
    paddingHorizontal: onboardingLayout.horizontalPadding,
    gap: PERSONALIZATION_SECTION_GAP,
    alignItems: 'flex-start',
  },
  headlineBlock: {
    gap: onboardingLayout.promiseHeaderGap,
    alignItems: 'flex-start',
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    lineHeight: typography.fontSize.xxl * typography.lineHeight.tight,
  },
  body: {
    color: colors.onboardingTextMuted,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.md * PERSONALIZATION_BODY_LINE_HEIGHT,
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
