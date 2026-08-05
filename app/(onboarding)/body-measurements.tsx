import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_MEASUREMENT_HELP_SECTIONS,
  HomeIndicator,
  MeasurementHelpModal,
  OnboardingMountainBackground,
  ProfileMeasurementField,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import {
  getPendingProfileMeasurements,
  updatePendingProfileMeasurements,
} from '@/lib/onboarding/pending-profile-storage';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementChoiceLayout,
  onboardingProfileLayout,
  typography,
} from '@/theme';

/** Onboarding body measurement step — waist and neck only. */
const MEASUREMENT_HELP_LABEL = 'Hur mäter jag midja och hals?';
const PROFILE_INTRO_TOP_OFFSET = 22;

function isValidMeasurement(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function setMeasurementField(
  value: number | undefined,
  setter: (next: string) => void,
): void {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    setter(String(value));
  }
}

export default function OnboardingBodyMeasurementsScreen() {
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [measurementHelpVisible, setMeasurementHelpVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getPendingProfileMeasurements().then((pending) => {
      if (!pending) {
        return;
      }

      setMeasurementField(pending.waistCm, setWaist);
      setMeasurementField(pending.neckCm, setNeck);
    });
  }, []);

  const canContinue = isValidMeasurement(waist) && isValidMeasurement(neck);

  const handleContinue = async () => {
    if (!canContinue || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    const updated = await updatePendingProfileMeasurements({
      waistCm: Number(waist),
      neckCm: Number(neck),
    });

    setIsSubmitting(false);

    if (!updated) {
      router.replace(routes.onboardingStep4);
      return;
    }

    router.push(routes.onboardingStep5);
  };

  const handleSkipLater = () => {
    router.push(routes.onboardingStep5);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" translucent backgroundColor="transparent" />
      <OnboardingMountainBackground overlayColor={colors.onboardingProfileOverlay} />
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
          >
            <View style={styles.headerBlock}>
              <Text style={styles.title}>Kroppsmått</Text>
              <Text style={styles.subtitle}>
                Ange midje- och halsmått för en mer träffsäker första NORDYAN Health Score.
              </Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.helperText}>
                Har du inget måttband just nu? Du kan alltid registrera kroppsmåtten senare under
                Hälsa.
              </Text>
              <Text style={styles.sectionLabel}>Kroppsmått</Text>
              <Card
                padding={onboardingProfileLayout.formCardPadding}
                borderRadius={onboardingProfileLayout.formCardRadius}
                style={styles.measurementCard}
              >
                <ProfileMeasurementField
                  label="Midjemått"
                  value={waist}
                  unit="cm"
                  placeholder="Ange"
                  uppercaseLabel={false}
                  stacked
                  onChangeText={setWaist}
                />
                <ProfileMeasurementField
                  label="Halsmått"
                  value={neck}
                  unit="cm"
                  placeholder="Ange"
                  uppercaseLabel={false}
                  stacked
                  onChangeText={setNeck}
                />
              </Card>
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.measurementHelpLink,
                pressed && styles.measurementHelpLinkPressed,
              ]}
              onPress={() => setMeasurementHelpVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={MEASUREMENT_HELP_LABEL}
            >
              <View style={styles.measurementHelpLabelGroup}>
                <Ionicons
                  name="information-circle-outline"
                  size={onboardingProfileLayout.helpIconSize}
                  color={colors.onboardingAccent}
                />
                <Text style={styles.measurementHelpLinkText} numberOfLines={1}>
                  {MEASUREMENT_HELP_LABEL}
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={onboardingProfileLayout.helpChevronSize}
                color={colors.onboardingAccent}
              />
            </Pressable>

            <View style={styles.footer}>
              <Button
                label={isSubmitting ? ' ' : 'Registrera kroppsmått'}
                variant="onboarding"
                style={styles.button}
                disabled={!canContinue || isSubmitting}
                onPress={() => {
                  void handleContinue();
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Gör detta senare"
                onPress={handleSkipLater}
                style={({ pressed }) => [
                  styles.secondaryTextButton,
                  pressed && styles.secondaryTextButtonPressed,
                ]}
              >
                <Text style={styles.secondaryTextButtonLabel}>Gör detta senare</Text>
              </Pressable>
              <HomeIndicator />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <MeasurementHelpModal
        visible={measurementHelpVisible}
        title="Så mäter du"
        sections={DEFAULT_MEASUREMENT_HELP_SECTIONS}
        onClose={() => setMeasurementHelpVisible(false)}
      />
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
    paddingTop: onboardingProfileLayout.formAreaPaddingTop + PROFILE_INTRO_TOP_OFFSET,
    paddingHorizontal: onboardingLayout.horizontalPadding,
    paddingBottom: onboardingLayout.contentPaddingBottom + onboardingProfileLayout.scrollBottomPadding,
  },
  headerBlock: {
    gap: onboardingProfileLayout.headerGap,
    width: '100%',
    marginBottom:
      onboardingProfileLayout.formHeaderGap + onboardingProfileLayout.headerBottomSpacing,
  },
  title: {
    color: colors.onboardingText,
    fontSize: onboardingProfileLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: onboardingProfileLayout.titleFontSize * typography.lineHeight.tight,
    letterSpacing: onboardingProfileLayout.titleLetterSpacing,
  },
  subtitle: {
    color: colors.onboardingProfileSubtitle,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    width: '100%',
  },
  formSection: {
    gap: 12,
    width: '100%',
  },
  helperText: {
    color: colors.onboardingProfileSubtitle,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
    width: '100%',
  },
  sectionLabel: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  measurementCard: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderColor: colors.onboardingProfileFormBorder,
    gap: onboardingProfileLayout.formCardGap,
  },
  measurementHelpLink: {
    alignSelf: 'stretch',
    minHeight: onboardingProfileLayout.helpLinkMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    marginTop: onboardingProfileLayout.sectionGap,
  },
  measurementHelpLinkPressed: {
    opacity: 0.75,
  },
  measurementHelpLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: onboardingProfileLayout.helpLinkGap,
    minWidth: 0,
    paddingRight: onboardingProfileLayout.helpLinkGap,
  },
  measurementHelpLinkText: {
    flexShrink: 1,
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    gap: onboardingMeasurementChoiceLayout.actionsGap,
    marginTop: onboardingProfileLayout.footerTopSpacing,
    paddingTop: onboardingProfileLayout.footerTopPadding,
  },
  button: {
    width: '100%',
  },
  secondaryTextButton: {
    alignSelf: 'center',
    minHeight: onboardingMeasurementChoiceLayout.secondaryButtonMinHeight,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: onboardingLayout.horizontalPadding,
  },
  secondaryTextButtonPressed: {
    opacity: 0.85,
  },
  secondaryTextButtonLabel: {
    color: colors.onboardingAccent,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
});
