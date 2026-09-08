import { router } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
  ProfileAccountHeaderCard,
  ProfileMountainHeader,
  ProfileSettingsCard,
  ProfileSettingsDivider,
  ProfileSettingsRow,
  ProfileSettingsSection,
} from '@/components/profile';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { useCurrentProfile } from '@/lib/hooks/profile';
import { buildProfileAccountHeaderView } from '@/lib/presentation/profile-account';
import { buildProfileHomeView, type ProfileHomeRow } from '@/lib/presentation/profile-home';
import {
  buildFeedbackMailto,
  buildHelpAndSupportMailto,
  openMailtoUrl,
} from '@/lib/presentation/support-mail';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useAuth } from '@/providers/auth-provider';
import { colors, profileLayout, profileTypography, typography } from '@/theme';

function handleProfileRowPress(row: ProfileHomeRow) {
  if (row.status === 'active' && 'action' in row) {
    if (row.action === 'mailto-feedback') {
      void openMailtoUrl(buildFeedbackMailto());
      return;
    }
    if (row.action === 'mailto-help') {
      void openMailtoUrl(buildHelpAndSupportMailto());
      return;
    }
  }
  if (row.route) {
    router.push(row.route);
  }
}

export default function ProfileMainScreen() {
  const { locale } = useI18n();
  const { signOut, session } = useAuth();
  const { profile } = useCurrentProfile();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const home = useMemo(() => buildProfileHomeView(), [locale]);

  const accountHeader = useMemo(
    () =>
      buildProfileAccountHeaderView({
        firstName: profile?.firstName,
        email: session?.user.email,
      }),
    [profile?.firstName, session?.user.email],
  );

  const handleSignOut = useCallback(async () => {
    setErrorMessage(null);
    setIsSigningOut(true);

    const result = await signOut();

    setIsSigningOut(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    router.replace(routes.root);
  }, [signOut]);

  return (
    <ScreenContainer variant="profile">
      <View style={styles.root}>
        <ProfileMountainHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>{t('profile.title')}</Text>

          <ProfileAccountHeaderCard
            name={accountHeader.displayName}
            email={accountHeader.email}
            onPress={() => router.push(home.accountCard.route)}
          />

          {home.sections.map((section) => (
            <ProfileSettingsSection key={section.id} title={section.title}>
              <ProfileSettingsCard>
                {section.rows.map((row, index) => (
                  <View key={row.id}>
                    {index > 0 ? <ProfileSettingsDivider /> : null}
                    <ProfileSettingsRow
                      icon={row.icon}
                      title={row.title}
                      subtitle={'subtitle' in row ? row.subtitle : undefined}
                      showChevron={row.showChevron}
                      comingSoon={row.status === 'comingSoon'}
                      onPress={
                        row.route ||
                        ('action' in row &&
                          (row.action === 'mailto-feedback' || row.action === 'mailto-help'))
                          ? () => handleProfileRowPress(row)
                          : undefined
                      }
                    />
                  </View>
                ))}
              </ProfileSettingsCard>
            </ProfileSettingsSection>
          ))}

          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon="log-out-outline"
              title={isSigningOut ? t('profile.signingOut') : home.signOut.title}
              titleColor={colors.homeTextMuted}
              showChevron={home.signOut.showChevron}
              onPress={handleSignOut}
            />
          </ProfileSettingsCard>

          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        </ScrollView>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: profileLayout.sectionGap,
    paddingHorizontal: profileLayout.horizontalPadding,
    paddingTop:
      profileLayout.scrollTopPadding +
      profileLayout.headerTopOffset +
      profileLayout.titleTopInset,
    paddingBottom: profileLayout.scrollBottomPadding,
  },
  screenTitle: {
    color: colors.onboardingText,
    fontSize: profileTypography.screenTitleSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: profileTypography.screenTitleSize * typography.lineHeight.tight,
    zIndex: 1,
  },
  error: {
    color: colors.onboardingErrorText,
    fontSize: typography.fontSize.sm,
  },
});
