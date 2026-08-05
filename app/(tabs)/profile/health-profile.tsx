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

import {
  ActivityHelpModal,
  ProfileMeasurementField,
  ProfileSingleChoiceGroup,
} from '@/components/onboarding';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import type { ProfileActivityLevel, ProfileGender } from '@/lib/domain/profile';
import {
  PROFILE_ACTIVITY_LEVEL_OPTIONS,
  PROFILE_GENDER_OPTIONS,
} from '@/lib/domain/profile';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { profileService } from '@/lib/services/profile/profile.service';
import { createHealthSnapshotFromProfile } from '@/lib/services/snapshots';
import {
  colors,
  onboardingProfileLayout,
  profileHealthProfileLayout,
  typography,
} from '@/theme';

/** Figma: nordyan-profile-health-profile (design frozen) */
const ACTIVITY_HELP_LABEL = 'Hur väljer jag aktivitetsnivå?';

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

export default function HealthProfileScreen() {
  const { profile, isLoading, refresh } = useCurrentProfile();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState<ProfileGender | null>(null);
  const [activityLevel, setActivityLevel] = useState<ProfileActivityLevel | null>(null);
  const [activityHelpVisible, setActivityHelpVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!profile) {
      return;
    }

    if (profile.dateOfBirth) {
      setDateOfBirth(profile.dateOfBirth.slice(0, 10));
    }

    if (typeof profile.heightCm === 'number' && profile.heightCm > 0) {
      setHeight(String(profile.heightCm));
    }

    if (profile.gender) {
      setGender(profile.gender);
    }

    if (profile.activityLevel) {
      setActivityLevel(profile.activityLevel);
    }
  }, [profile]);

  const canSave =
    isValidDateOfBirth(dateOfBirth) &&
    isValidMeasurement(height) &&
    gender !== null &&
    activityLevel !== null;

  const handleSave = async () => {
    if (!profile || !canSave || !gender || !activityLevel || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    const result = await profileService.completeOnboarding({
      dateOfBirth: dateOfBirth.trim(),
      gender,
      activityLevel,
      heightCm: Number(height),
      firstName: profile.firstName,
      goal: profile.goal,
    });

    setIsSaving(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    const snapshotResult = await createHealthSnapshotFromProfile(result.value, 'profile_update');
    if (!snapshotResult.ok) {
      if (__DEV__) {
        console.warn('[health-profile] snapshot failed', snapshotResult.error);
      }
    }

    await refresh();
    router.back();
  };

  return (
    <ScreenContainer variant="dark" style={styles.screen}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoiding}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.navBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tillbaka"
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={profileHealthProfileLayout.backIconSize}
              color={colors.onboardingText}
            />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets
        >
          {!isLoading && profile ? (
            <>
              <View style={styles.headerBlock}>
                <Text style={styles.title}>Hälsoprofil</Text>
                <Text style={styles.subtitle}>
                  Hantera personliga uppgifter som används för att beräkna din NORDYAN Health Score.
                </Text>
              </View>

              <ProfileSingleChoiceGroup
                label="Kön"
                value={gender}
                options={PROFILE_GENDER_OPTIONS}
                onChange={setGender}
                layout="row"
                optionIcons={PROFILE_GENDER_ICONS}
              />

              <View style={styles.measurementsSection}>
                <Text style={styles.sectionLabel}>Personlig profil</Text>
                <Card
                  padding={onboardingProfileLayout.formCardPadding}
                  borderRadius={onboardingProfileLayout.formCardRadius}
                  style={styles.measurementsCard}
                >
                  <ProfileMeasurementField
                    label="Födelsedatum"
                    value={dateOfBirth}
                    unit=""
                    placeholder="ÅÅÅÅ-MM-DD"
                    uppercaseLabel={false}
                    stacked
                    onChangeText={setDateOfBirth}
                  />
                  <ProfileMeasurementField
                    label="Längd"
                    value={height}
                    unit="cm"
                    placeholder="Ange"
                    uppercaseLabel={false}
                    stacked
                    onChangeText={setHeight}
                  />
                </Card>
              </View>

              <View style={styles.activitySection}>
                <Text style={styles.sectionLabel}>Aktivitet</Text>
                <Card
                  padding={onboardingProfileLayout.formCardPadding}
                  borderRadius={onboardingProfileLayout.formCardRadius}
                  style={styles.measurementsCard}
                >
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
                      size={profileHealthProfileLayout.helpChevronSize}
                      color={colors.onboardingAccent}
                    />
                  </Pressable>
                </Card>
              </View>

              <Button
                label={isSaving ? 'Sparar…' : 'Spara ändringar'}
                variant="onboarding"
                style={styles.saveButton}
                onPress={handleSave}
                disabled={!canSave || isSaving}
              />

              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <ActivityHelpModal
        visible={activityHelpVisible}
        onClose={() => setActivityHelpVisible(false)}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  keyboardAvoiding: {
    flex: 1,
  },
  navBar: {
    height: profileHealthProfileLayout.navBarHeight,
    paddingHorizontal: profileHealthProfileLayout.navBarPaddingHorizontal,
    paddingVertical: profileHealthProfileLayout.navBarPaddingVertical,
    justifyContent: 'center',
  },
  backButton: {
    width: profileHealthProfileLayout.backIconSize,
    height: profileHealthProfileLayout.backIconSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: profileHealthProfileLayout.sectionGap,
    paddingHorizontal: profileHealthProfileLayout.horizontalPadding,
    paddingTop: profileHealthProfileLayout.scrollPaddingTop,
    paddingBottom: profileHealthProfileLayout.scrollPaddingBottom,
  },
  headerBlock: {
    gap: profileHealthProfileLayout.headerGap,
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileHealthProfileLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: profileHealthProfileLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.onboardingProfileSubtitle,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
    width: '100%',
  },
  measurementsSection: {
    width: '100%',
    gap: profileHealthProfileLayout.sectionLabelGap,
  },
  activitySection: {
    width: '100%',
    gap: profileHealthProfileLayout.sectionLabelGap,
  },
  sectionLabel: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  measurementsCard: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderColor: colors.onboardingProfileFormBorder,
    gap: profileHealthProfileLayout.measurementsCardGap,
  },
  activityHelpLink: {
    alignSelf: 'stretch',
    minHeight: profileHealthProfileLayout.helpRowMinHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: profileHealthProfileLayout.helpRowPaddingVertical,
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
    fontSize: profileHealthProfileLayout.helpLinkFontSize,
    fontWeight: typography.fontWeight.medium,
  },
  saveButton: {
    width: '100%',
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
  },
});
