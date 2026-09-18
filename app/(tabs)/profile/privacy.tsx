import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { buildProfilePrivacyView } from '@/lib/presentation/profile-privacy';
import { useAuth } from '@/providers/auth-provider';
import {
  colors,
  profileHealthProfileLayout,
  radii,
  spacing,
  typography,
} from '@/theme';

export default function ProfilePrivacyScreen() {
  const { locale } = useI18n();
  const { deleteAccount } = useAuth();
  const copy = useMemo(() => buildProfilePrivacyView(), [locale]);
  const [understood, setUnderstood] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runDelete = useCallback(async () => {
    setErrorMessage(null);
    setIsDeleting(true);
    const result = await deleteAccount();
    if (!result.ok) {
      setIsDeleting(false);
      setErrorMessage(copy.error);
      return;
    }
    router.replace(routes.root);
  }, [copy.error, deleteAccount]);

  const handleDeletePress = useCallback(() => {
    if (!understood || isDeleting) {
      return;
    }

    Alert.alert(copy.alertTitle, copy.alertMessage, [
      { text: copy.cancel, style: 'cancel' },
      {
        text: copy.alertConfirm,
        style: 'destructive',
        onPress: () => {
          void runDelete();
        },
      },
    ]);
  }, [copy.alertConfirm, copy.alertMessage, copy.alertTitle, copy.cancel, isDeleting, runDelete, understood]);

  return (
    <ScreenContainer variant="profile">
      <StatusBar style="light" />
      <View style={styles.navBar}>
        <OnboardingBackButton
          onPress={() => router.back()}
          disabled={isDeleting}
        />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{copy.deleteTitle}</Text>
        <Text style={styles.body}>{copy.body}</Text>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: understood }}
          accessibilityLabel={copy.confirmCheck}
          disabled={isDeleting}
          onPress={() => setUnderstood((current) => !current)}
          style={styles.checkRow}
        >
          <Ionicons
            name={understood ? 'checkbox' : 'square-outline'}
            size={22}
            color={understood ? colors.onboardingAccent : colors.homeTextMuted}
          />
          <Text style={styles.checkLabel}>{copy.confirmCheck}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isDeleting ? copy.processing : copy.action}
          disabled={!understood || isDeleting}
          onPress={handleDeletePress}
          style={({ pressed }) => [
            styles.deleteButton,
            (!understood || isDeleting) && styles.deleteButtonDisabled,
            pressed && understood && !isDeleting && styles.deleteButtonPressed,
          ]}
        >
          <Text style={styles.deleteButtonLabel}>
            {isDeleting ? copy.processing : copy.action}
          </Text>
        </Pressable>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: profileHealthProfileLayout.navBarHeight,
    paddingHorizontal: profileHealthProfileLayout.navBarPaddingHorizontal,
    paddingVertical: profileHealthProfileLayout.navBarPaddingVertical,
    justifyContent: 'center',
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
  title: {
    color: colors.onboardingText,
    fontSize: profileHealthProfileLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: profileHealthProfileLayout.titleFontSize * typography.lineHeight.tight,
  },
  body: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  checkLabel: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
  },
  deleteButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: radii.md,
    backgroundColor: colors.onboardingErrorText,
    paddingHorizontal: spacing.lg,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonPressed: {
    opacity: 0.85,
  },
  deleteButtonLabel: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
  },
});
