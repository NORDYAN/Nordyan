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
import { isPositiveMeasurementInput, parseMeasurementNumericInput } from '@/components/measurement/measurement-input.utils';
import { isSupportedHipCm } from '@/lib/domain/measurement';
import { routes } from '@/constants/routes';
import { onboardingResultHref } from '@/lib/onboarding/onboarding-result-navigation';
import { emitOnboardingForensics } from '@/lib/onboarding/onboarding-forensics-emit';
import {
  getPendingProfileOwnerState,
  getVisiblePendingProfileMeasurements,
  updatePendingProfileMeasurements,
} from '@/lib/onboarding/pending-profile-storage';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  onboardingLayout,
  onboardingMeasurementChoiceLayout,
  onboardingProfileLayout,
  typography,
} from '@/theme';

/** Onboarding body measurement step — waist, neck, and hip. */
const PROFILE_INTRO_TOP_OFFSET = 22;

function setMeasurementField(
  value: number | undefined,
  setter: (next: string) => void,
): void {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    setter(String(value));
  }
}

export default function OnboardingBodyMeasurementsScreen() {
  useI18n();
  const { status, session } = useAuth();
  const userId = status === 'authenticated' ? session?.user.id ?? null : null;
  const [waist, setWaist] = useState('');
  const [neck, setNeck] = useState('');
  const [hip, setHip] = useState('');
  const [measurementHelpVisible, setMeasurementHelpVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void getVisiblePendingProfileMeasurements(userId).then((pending) => {
      if (!pending) {
        setWaist('');
        setNeck('');
        setHip('');
        return;
      }

      setMeasurementField(pending.waistCm, setWaist);
      setMeasurementField(pending.neckCm, setNeck);
      setMeasurementField(pending.hipCm, setHip);
    });
  }, [userId]);

  const waistCm = parseMeasurementNumericInput(waist);
  const neckCm = parseMeasurementNumericInput(neck);
  const hipCm = parseMeasurementNumericInput(hip);
  const canContinue =
    isPositiveMeasurementInput(waist) &&
    isPositiveMeasurementInput(neck) &&
    hipCm !== null &&
    isSupportedHipCm(hipCm);

  const handleContinue = async () => {
    if (!canContinue || isSubmitting || waistCm === null || neckCm === null || hipCm === null) {
      return;
    }

    setIsSubmitting(true);

    const updated = await updatePendingProfileMeasurements({
      waistCm,
      neckCm,
      hipCm,
    });
    const profileOwnerState = await getPendingProfileOwnerState();

    await emitOnboardingForensics({
      event: 'measurement-save',
      authenticated: status === 'authenticated',
      viewerUserId: userId,
      profileWriteResult: updated
        ? 'written'
        : profileOwnerState === 'bound'
          ? 'ignored_bound'
          : 'not_attempted',
      lifestyleWriteResult: 'not_attempted',
      visitIdPresent: false,
    });

    setIsSubmitting(false);

    if (!updated) {
      router.replace(routes.onboardingStep4);
      return;
    }

    router.push(onboardingResultHref());
  };

  const handleSkipLater = () => {
    router.push(onboardingResultHref());
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
              <Text style={styles.title}>{t('onboarding.bodyMeasurements.title')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.bodyMeasurements.subtitle')}</Text>
            </View>

            <View style={styles.formSection}>
              <Text style={styles.helperText}>{t('onboarding.bodyMeasurements.helperText')}</Text>
              <Text style={styles.sectionLabel}>{t('onboarding.bodyMeasurements.sectionLabel')}</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.measurementHelpLink,
                  pressed && styles.measurementHelpLinkPressed,
                ]}
                onPress={() => setMeasurementHelpVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.measureHelp')}
              >
                <View style={styles.measurementHelpLabelGroup}>
                  <Ionicons
                    name="information-circle-outline"
                    size={onboardingProfileLayout.helpIconSize}
                    color={colors.onboardingAccent}
                  />
                  <Text style={styles.measurementHelpLinkText} numberOfLines={1}>
                    {t('onboarding.measureHelp')}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={onboardingProfileLayout.helpChevronSize}
                  color={colors.onboardingAccent}
                />
              </Pressable>
              <Card
                padding={onboardingProfileLayout.formCardPadding}
                borderRadius={onboardingProfileLayout.formCardRadius}
                style={styles.measurementCard}
              >
                <ProfileMeasurementField
                  label={t('onboarding.waist')}
                  value={waist}
                  unit="cm"
                  placeholder={t('health.new.placeholder')}
                  uppercaseLabel={false}
                  stacked
                  onChangeText={setWaist}
                />
                <ProfileMeasurementField
                  label={t('onboarding.neck')}
                  value={neck}
                  unit="cm"
                  placeholder={t('health.new.placeholder')}
                  uppercaseLabel={false}
                  stacked
                  onChangeText={setNeck}
                />
                <ProfileMeasurementField
                  label={t('onboarding.hip')}
                  value={hip}
                  unit="cm"
                  placeholder={t('health.new.placeholder')}
                  uppercaseLabel={false}
                  stacked
                  onChangeText={setHip}
                />
              </Card>
            </View>

            <View style={styles.footer}>
              <Button
                label={isSubmitting ? ' ' : t('onboarding.registerMeasurements')}
                variant="onboarding"
                style={styles.button}
                disabled={!canContinue || isSubmitting}
                onPress={() => {
                  void handleContinue();
                }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('onboarding.doThisLater')}
                onPress={handleSkipLater}
                style={({ pressed }) => [
                  styles.secondaryTextButton,
                  pressed && styles.secondaryTextButtonPressed,
                ]}
              >
                <Text style={styles.secondaryTextButtonLabel}>{t('onboarding.doThisLater')}</Text>
              </Pressable>
              <HomeIndicator />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <MeasurementHelpModal
        visible={measurementHelpVisible}
        title={t('onboarding.howToMeasure')}
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
