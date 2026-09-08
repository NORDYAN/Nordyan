import { StatusBar } from 'expo-status-bar';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HomeIndicator, OnboardingMountainBackground } from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  HEALTH_DATA_CONSENT_COPY,
  PRIVACY_POLICY_URL,
  canSubmitHealthDataConsent,
} from '@/lib/presentation/health-data-consent';
import { colors, typography } from '@/theme';

const HORIZONTAL_PADDING = 32;
const SECTION_GAP = 20;

export function HealthDataConsentView(props: {
  isSubmitting: boolean;
  errorMessage?: string | null;
  onContinue: () => void | Promise<void>;
}) {
  const { locale } = useI18n();
  const copy = useMemo(() => HEALTH_DATA_CONSENT_COPY, [locale]);
  const [checked, setChecked] = useState(false);
  const canContinue = canSubmitHealthDataConsent(checked);

  const handleOpenPolicy = useCallback(() => {
    void Linking.openURL(PRIVACY_POLICY_URL);
  }, []);

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground />
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.stage}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.title} accessibilityRole="header" maxFontSizeMultiplier={1.1}>
              {copy.title}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.15}>
              {copy.body}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.15}>
              {copy.bodySecondary}
            </Text>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked }}
              accessibilityLabel={copy.checkbox}
              onPress={() => setChecked((current) => !current)}
              style={styles.checkRow}
            >
              <Ionicons
                name={checked ? 'checkbox' : 'square-outline'}
                size={22}
                color={checked ? colors.onboardingAccent : 'rgba(255, 255, 255, 0.7)'}
              />
              <Text style={styles.checkLabel} maxFontSizeMultiplier={1.15}>
                {copy.checkbox}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.policyLink}
              onPress={handleOpenPolicy}
              style={styles.policyLinkHit}
            >
              <Text style={styles.policyLink}>{copy.policyLink}</Text>
            </Pressable>
            {props.errorMessage ? (
              <Text style={styles.error} maxFontSizeMultiplier={1.15}>
                {props.errorMessage}
              </Text>
            ) : null}
          </ScrollView>
          <View style={styles.footer}>
            <Button
              label={copy.continue}
              variant="onboarding"
              disabled={!canContinue || props.isSubmitting}
              accessibilityState={{
                disabled: !canContinue || props.isSubmitting,
                busy: props.isSubmitting,
              }}
              style={[styles.button, (!canContinue || props.isSubmitting) && styles.buttonDisabled]}
              onPress={() => {
                if (!canContinue || props.isSubmitting) {
                  return;
                }
                void props.onContinue();
              }}
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
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 56,
    gap: SECTION_GAP,
    paddingBottom: 24,
  },
  title: {
    color: colors.onboardingText,
    fontSize: 32,
    lineHeight: 38,
    fontWeight: typography.fontWeight.bold,
  },
  body: {
    color: 'rgba(255, 255, 255, 0.82)',
    fontSize: 18,
    lineHeight: 31,
    fontWeight: typography.fontWeight.regular,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 44,
  },
  checkLabel: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: typography.fontWeight.regular,
  },
  policyLinkHit: {
    minHeight: 44,
    justifyContent: 'center',
  },
  policyLink: {
    color: colors.onboardingAccent,
    fontSize: 16,
    fontWeight: typography.fontWeight.medium,
  },
  error: {
    color: colors.onboardingAccent,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: typography.fontWeight.regular,
  },
  footer: {
    gap: 20,
    paddingBottom: 8,
  },
  button: {
    width: '100%',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
