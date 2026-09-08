import { StatusBar } from 'expo-status-bar';
import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onboardingAssets } from '@/assets/images/onboarding';
import { NordicIdentityFlags } from '@/components/auth/NordicIdentityFlags';
import { NordyanMountainLogo } from '@/components/branding/NordyanMountainLogo';
import { OnboardingMountainBackground } from '@/components/onboarding';
import { Text } from '@/components/ui/Text';
import { colors, typography } from '@/theme';
import { authLayout } from '@/theme/auth';

type AuthLayoutProps = {
  children: ReactNode;
};

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground
        backgroundSource={onboardingAssets.mountainBackgroundPromise}
        overlayColor={authLayout.overlay}
      />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardAvoiding}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets
            removeClippedSubviews={false}
          >
            <View style={styles.brand} accessibilityLabel="NORDYAN">
              <NordyanMountainLogo
                width={authLayout.brandMarkWidth}
                height={authLayout.brandMarkHeight}
              />
              <Text style={styles.wordmark} maxFontSizeMultiplier={1.05}>
                NORDYAN
              </Text>
              <NordicIdentityFlags />
            </View>
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoiding: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: authLayout.contentPaddingTop,
    paddingHorizontal: authLayout.horizontalPadding,
    paddingBottom: authLayout.contentPaddingBottom,
  },
  brand: {
    alignItems: 'center',
    gap: authLayout.brandGap,
    marginBottom: authLayout.brandToHeadingGap,
  },
  wordmark: {
    color: colors.onboardingText,
    fontSize: authLayout.wordmarkSize,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: authLayout.wordmarkLineHeight,
    textAlign: 'center',
    includeFontPadding: false,
  },
});
