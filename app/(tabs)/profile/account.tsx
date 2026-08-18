import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ProfileAccountField } from '@/components/profile/ProfileAccountField';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { ACCOUNT_FIRST_NAME_MAX_LENGTH, validateAccountFirstName } from '@/lib/domain/profile';
import { useCurrentProfile } from '@/lib/hooks/profile';
import {
  PROFILE_ACCOUNT_COPY,
  buildAccountProfileFormView,
} from '@/lib/presentation/profile-account';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { profileService } from '@/lib/services/profile';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  onboardingProfileLayout,
  profileHealthProfileLayout,
  typography,
} from '@/theme';

export default function AccountProfileScreen() {
  useI18n();
  const { session } = useAuth();
  const { profile, isLoading, error, refresh } = useCurrentProfile();
  const form = useMemo(
    () =>
      buildAccountProfileFormView({
        firstName: profile?.firstName,
        email: session?.user.email,
      }),
    [profile?.firstName, session?.user.email],
  );
  const [firstNameDraft, setFirstNameDraft] = useState(form.firstNameDraft);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFirstNameDraft(form.firstNameDraft);
  }, [form.firstNameDraft]);

  const draftValidation = validateAccountFirstName(
    firstNameDraft.trim() ? firstNameDraft.trim() : null,
  );
  const canSave = Boolean(profile) && !isSaving && !isLoading && draftValidation === null;

  const handleSave = async () => {
    if (!canSave || isSaving) {
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const result = await profileService.updateAccountProfile({ firstName: firstNameDraft });

    if (!result.ok) {
      setIsSaving(false);
      setErrorMessage(result.error.message);
      return;
    }

    await refresh({ showLoading: false });
    setIsSaving(false);
    setSuccessMessage(PROFILE_ACCOUNT_COPY.saveSuccessMessage);
    router.back();
  };

  const loadFailed = !isLoading && (error != null || profile == null);

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
            accessibilityLabel={t('common.back')}
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
          <View style={styles.headerBlock}>
            <Text style={styles.title}>{PROFILE_ACCOUNT_COPY.title}</Text>
          </View>

          {loadFailed ? (
            <Text style={styles.error}>{PROFILE_ACCOUNT_COPY.loadErrorMessage}</Text>
          ) : null}

          {!isLoading && profile ? (
            <>
              <Card
                padding={onboardingProfileLayout.formCardPadding}
                borderRadius={onboardingProfileLayout.formCardRadius}
                style={styles.formCard}
              >
                <ProfileAccountField
                  label={t('profile.account.firstName')}
                  value={firstNameDraft}
                  placeholder={t('profile.account.firstNamePlaceholder')}
                  maxLength={ACCOUNT_FIRST_NAME_MAX_LENGTH}
                  errorMessage={draftValidation?.message}
                  onChangeText={(next) => {
                    setSuccessMessage(null);
                    setErrorMessage(null);
                    setFirstNameDraft(next);
                  }}
                />
                <ProfileAccountField
                  label={t('profile.account.email')}
                  value={form.email}
                  editable={false}
                />
              </Card>

              <Button
                label={isSaving ? PROFILE_ACCOUNT_COPY.savingLabel : PROFILE_ACCOUNT_COPY.saveLabel}
                variant="onboarding"
                style={styles.saveButton}
                onPress={() => {
                  void handleSave();
                }}
                disabled={!canSave}
              />

              {successMessage ? <Text style={styles.success}>{successMessage}</Text> : null}
              {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
            </>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
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
  formCard: {
    width: '100%',
    backgroundColor: colors.onboardingProfileFormBackground,
    borderColor: colors.onboardingProfileFormBorder,
    gap: onboardingProfileLayout.formCardGap,
  },
  saveButton: {
    width: '100%',
  },
  success: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
  },
});
