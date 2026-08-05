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
  ActivityHelpModal,
  HomeIndicator,
  OnboardingMountainBackground,
  ProfileDateOfBirthField,
  ProfileMeasurementField,
  ProfileSingleChoiceGroup,
} from '@/components/onboarding';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import type { ProfileActivityLevel, ProfileGender } from '@/lib/domain/profile';
import {
  PROFILE_ACTIVITY_LEVEL_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from '@/lib/domain/profile';
import {
  getPendingProfileMeasurements,
  setPendingProfileMeasurements,
} from '@/lib/onboarding/pending-profile-storage';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { colors, onboardingLayout, onboardingProfileLayout, typography } from '@/theme';

/** Figma: nordyan-onboarding-personal-profile-v2 (design frozen) */
const ACTIVITY_HELP_LABEL = 'Hur väljer jag aktivitetsnivå?';
const PROFILE_INTRO_TOP_OFFSET = 22;
const ACTIVITY_HELP_LINK_FONT_SIZE = 13;

const PROFILE_GENDER_ICONS: Partial<
  Record<ProfileGender, keyof typeof Ionicons.glyphMap>
> = {
  male: 'male',
  female: 'female',
  other: 'person',
};

function isValidMeasurement(value: string): boolean {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0;
}

function isValidDateOfBirth(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

function setMeasurementField(
  value: number | undefined,
  setter: (next: string) => void,
): void {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
    setter(String(value));
  }
}

export default function OnboardingProfileScreen() {
  const { profile } = useCurrentProfile();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [activityLevel, setActivityLevel] = useState<ProfileActivityLevel | null>(null);
  const [activityHelpVisible, setActivityHelpVisible] = useState(false);

  useEffect(() => {
    void getPendingProfileMeasurements().then((pending) => {
      if (pending) {
        if (pending.dateOfBirth) {
          setDateOfBirth(pending.dateOfBirth);
        }
        setMeasurementField(pending.heightCm, setHeight);
        setMeasurementField(pending.weightKg, setWeight);

        if (pending.gender) {
          setGender(pending.gender);
        }

        if (pending.activityLevel) {
          setActivityLevel(pending.activityLevel);
        }
        return;
      }

      if (!profile) {
        return;
      }

      if (profile.dateOfBirth) {
        setDateOfBirth(profile.dateOfBirth.slice(0, 10));
      }

      setMeasurementField(profile.heightCm ?? undefined, setHeight);
      setMeasurementField(profile.weightKg ?? undefined, setWeight);
      if (profile.gender) {
        setGender(profile.gender);
      }
      if (profile.activityLevel) {
        setActivityLevel(profile.activityLevel);
      }
    });
  }, [profile]);

  const canContinue =
    isValidDateOfBirth(dateOfBirth) &&
    isValidMeasurement(height) &&
    isValidMeasurement(weight) &&
    gender !== null &&
    activityLevel !== null;

  const handleCalculateProfile = async () => {
    if (!canContinue || !gender || !activityLevel) {
      return;
    }

    await setPendingProfileMeasurements({
      dateOfBirth: dateOfBirth.trim(),
      gender,
      activityLevel,
      heightCm: Number(height),
      weightKg: Number(weight),
    });

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
              <Text style={styles.title}>Din personliga profil</Text>
              <Text style={styles.subtitle}>
                Ange dina grunduppgifter så att vi kan skapa din första NORDYAN Health Score.
              </Text>
            </View>

            <View style={styles.formCard}>
              <Text style={styles.sectionLabel}>Personlig profil</Text>

              <ProfileSingleChoiceGroup
                label="Kön"
                value={gender}
                options={PROFILE_GENDER_OPTIONS}
                onChange={setGender}
                layout="row"
                optionIcons={PROFILE_GENDER_ICONS}
              />

              <View style={styles.formRow}>
                <ProfileDateOfBirthField
                  label="Födelsedatum"
                  value={dateOfBirth}
                  uppercaseLabel={false}
                  onChange={setDateOfBirth}
                />
                <ProfileMeasurementField
                  label="Längd"
                  value={height}
                  unit="cm"
                  placeholder="Ange"
                  uppercaseLabel={false}
                  onChangeText={setHeight}
                />
              </View>

              <ProfileMeasurementField
                label="Vikt"
                value={weight}
                unit="kg"
                placeholder="Ange"
                uppercaseLabel={false}
                stacked
                onChangeText={setWeight}
              />
            </View>

            <View style={styles.activitySection}>
              <Text style={styles.sectionLabel}>Aktivitet</Text>
              <View style={styles.activityCard}>
                <ProfileSingleChoiceGroup
                  label="Aktivitetsnivå"
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
                  accessibilityLabel={ACTIVITY_HELP_LABEL}
                >
                  <View style={styles.activityHelpLabelGroup}>
                    <Ionicons
                      name="information-circle-outline"
                      size={onboardingProfileLayout.helpIconSize}
                      color={colors.onboardingAccent}
                    />
                    <Text style={styles.activityHelpLinkText} numberOfLines={1}>
                      {ACTIVITY_HELP_LABEL}
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
              <Button
                label="Beräkna min hälsoprofil"
                variant="onboarding"
                style={styles.button}
                onPress={handleCalculateProfile}
                disabled={!canContinue}
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
  formRow: {
    flexDirection: 'row',
    gap: onboardingProfileLayout.formRowGap,
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
  button: {
    width: '100%',
  },
});
