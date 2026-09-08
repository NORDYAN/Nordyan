import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
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
  ActivityHelpModal,
  HomeIndicator,
  OnboardingMountainBackground,
  ProfileDateOfBirthField,
  ProfileMeasurementField,
  ProfileSingleChoiceGroup,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { isPositiveMeasurementInput, parseMeasurementNumericInput } from '@/components/measurement/measurement-input.utils';
import { routes } from '@/constants/routes';
import { isEligibleAdultDateOfBirth } from '@/lib/domain/age-eligibility';
import type { ProfileActivityLevel, ProfileGender } from '@/lib/domain/profile';
import {
  PROFILE_ACTIVITY_LEVEL_OPTIONS,
  PROFILE_GENDER_OPTIONS,
  isWritableProfileGender,
} from '@/lib/domain/profile';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { resolveOnboardingProfileFormPrefill } from '@/lib/onboarding/onboarding-profile-form-prefill';
import { emitOnboardingForensics } from '@/lib/onboarding/onboarding-forensics-emit';
import {
  getVisiblePendingProfileMeasurements,
  setPendingProfileMeasurements,
} from '@/lib/onboarding/pending-profile-storage';
import {
  canContinueOnboardingPersonalProfile,
  onboardingProfileDobHeightLayout,
  resolveSelectableProfileGender,
} from '@/lib/presentation/onboarding-profile';
import { useAuth } from '@/providers/auth-provider';
import { colors, onboardingLayout, onboardingProfileLayout, typography } from '@/theme';

/** Figma: nordyan-onboarding-personal-profile-v2 (design frozen) */
const PROFILE_INTRO_TOP_OFFSET = 22;
const ACTIVITY_HELP_LINK_FONT_SIZE = 13;

const PROFILE_GENDER_ICONS: Partial<
  Record<ProfileGender, keyof typeof Ionicons.glyphMap>
> = {
  male: 'male',
  female: 'female',
  other: 'person',
};

function isValidDateOfBirth(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export default function OnboardingProfileScreen() {
  useI18n();
  const { status, session } = useAuth();
  const userId = status === 'authenticated' ? session?.user.id ?? null : null;
  const { profile } = useCurrentProfile();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [activityLevel, setActivityLevel] = useState<ProfileActivityLevel | null>(null);
  const [activityHelpVisible, setActivityHelpVisible] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;

      void getVisiblePendingProfileMeasurements(userId).then((pending) => {
        if (cancelled) {
          return;
        }

        const next = resolveOnboardingProfileFormPrefill({
          pending,
          authenticatedProfile: profile,
          userId,
        });
        setDateOfBirth(next.dateOfBirth);
        setHeight(next.height);
        setWeight(next.weight);
        setGender(next.gender);
        setActivityLevel(next.activityLevel);
      });

      return () => {
        cancelled = true;
      };
    }, [profile, userId]),
  );

  const heightCm = parseMeasurementNumericInput(height);
  const weightKg = parseMeasurementNumericInput(weight);
  const canContinue = canContinueOnboardingPersonalProfile({
    dateOfBirthValid: isValidDateOfBirth(dateOfBirth),
    heightValid: isPositiveMeasurementInput(height),
    weightValid: isPositiveMeasurementInput(weight),
    gender,
    activityLevel,
  });

  const handleCalculateProfile = async () => {
    if (
      !canContinue ||
      isSaving ||
      !isWritableProfileGender(gender) ||
      !activityLevel ||
      heightCm === null ||
      weightKg === null
    ) {
      return;
    }

    if (!isEligibleAdultDateOfBirth(dateOfBirth.trim())) {
      setSaveError(t('profile.validation.mustBe18'));
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    let profileWriteResult: Awaited<ReturnType<typeof setPendingProfileMeasurements>>;
    try {
      profileWriteResult = await setPendingProfileMeasurements({
        dateOfBirth: dateOfBirth.trim(),
        gender,
        activityLevel,
        heightCm,
        weightKg,
      });
    } catch {
      setSaveError(t('onboarding.syncError'));
      setIsSaving(false);
      return;
    }

    await emitOnboardingForensics({
      event: 'step-4-save',
      authenticated: status === 'authenticated',
      viewerUserId: userId,
      profileWriteResult,
      lifestyleWriteResult: 'not_attempted',
      visitIdPresent: false,
    });

    if (profileWriteResult !== 'written') {
      setSaveError(t('onboarding.syncError'));
      setIsSaving(false);
      return;
    }

    setIsSaving(false);
    router.push(routes.onboardingMeasurementChoice);
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
              <Text style={styles.title}>{t('onboarding.profile.title')}</Text>
              <Text style={styles.subtitle}>{t('onboarding.profile.subtitle')}</Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionLabel}>{t('onboarding.profile.sectionLabel')}</Text>

              <ProfileSingleChoiceGroup
                label={t('onboarding.profile.gender')}
                value={resolveSelectableProfileGender(gender)}
                options={PROFILE_GENDER_OPTIONS}
                onChange={setGender}
                layout="row"
                optionIcons={PROFILE_GENDER_ICONS}
                helper={t('onboarding.profile.genderHelper')}
              />

              <ProfileDateOfBirthField
                label={t('onboarding.dateOfBirth')}
                value={dateOfBirth}
                uppercaseLabel={false}
                stacked={onboardingProfileDobHeightLayout.dateOfBirthStacked}
                onChange={setDateOfBirth}
              />
              <ProfileMeasurementField
                label={t('onboarding.height')}
                value={height}
                unit="cm"
                placeholder={t('health.new.placeholder')}
                uppercaseLabel={false}
                stacked={onboardingProfileDobHeightLayout.heightStacked}
                onChangeText={setHeight}
              />

              <ProfileMeasurementField
                label={t('onboarding.weight')}
                value={weight}
                unit="kg"
                placeholder={t('health.new.placeholder')}
                uppercaseLabel={false}
                stacked
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.activitySection}>
              <Text style={styles.sectionLabel}>{t('onboarding.profile.activitySection')}</Text>
              <View style={styles.activityCard}>
                <ProfileSingleChoiceGroup
                  label={t('onboarding.activityLevel')}
                  value={activityLevel}
                  options={PROFILE_ACTIVITY_LEVEL_OPTIONS}
                  onChange={setActivityLevel}
                />

                <Pressable
                  style={({ pressed }) => [
                    styles.activityHelpLink,
                    pressed && styles.activityHelpLinkPressed,
                  ]}
                  onPress={() => setActivityHelpVisible(true)}
                  accessibilityRole="button"
                  accessibilityLabel={t('onboarding.activityHelp')}
                >
                  <View style={styles.activityHelpLabelGroup}>
                    <Ionicons
                      name="information-circle-outline"
                      size={onboardingProfileLayout.helpIconSize}
                      color={colors.onboardingAccent}
                    />
                    <Text style={styles.activityHelpLinkText} numberOfLines={1}>
                      {t('onboarding.activityHelp')}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={onboardingProfileLayout.helpChevronSize}
                    color={colors.onboardingAccent}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.footer}>
              {saveError ? (
                <Text style={styles.saveError} accessibilityLiveRegion="polite">
                  {saveError}
                </Text>
              ) : null}
              <Button
                label={t('onboarding.calculateProfile')}
                variant="onboarding"
                style={styles.button}
                onPress={handleCalculateProfile}
                disabled={!canContinue || isSaving}
              />
              <HomeIndicator />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ActivityHelpModal
        visible={activityHelpVisible}
        onClose={() => setActivityHelpVisible(false)}
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
  sectionLabel: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  formCard: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderRadius: onboardingProfileLayout.formCardRadius,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFormBorder,
    padding: onboardingProfileLayout.formCardPadding,
    gap: onboardingProfileLayout.formCardGap,
    width: '100%',
  },
  activitySection: {
    width: '100%',
    gap: 12,
    marginTop: onboardingProfileLayout.sectionGap,
  },
  activityCard: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderRadius: onboardingProfileLayout.formCardRadius,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFormBorder,
    padding: onboardingProfileLayout.formCardPadding,
    gap: onboardingProfileLayout.formCardGap,
    width: '100%',
  },
  activityHelpLink: {
    alignSelf: 'stretch',
    minHeight: onboardingProfileLayout.helpLinkMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  activityHelpLinkPressed: {
    opacity: 0.75,
  },
  activityHelpLabelGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: onboardingProfileLayout.helpLinkGap,
    minWidth: 0,
    paddingRight: onboardingProfileLayout.helpLinkGap,
  },
  activityHelpLinkText: {
    flexShrink: 1,
    color: colors.onboardingAccent,
    fontSize: ACTIVITY_HELP_LINK_FONT_SIZE,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    gap: onboardingLayout.footerGap,
    marginTop: onboardingProfileLayout.footerTopSpacing,
    paddingTop: onboardingProfileLayout.footerTopPadding,
  },
  saveError: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  button: {
    width: '100%',
  },
});
