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
import { useAuth } from '@/providers/auth-provider';
import { colors, profileLayout, profileTypography, typography } from '@/theme';

export default function ProfileMainScreen() {
  const { signOut, session } = useAuth();
  const { profile } = useCurrentProfile();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const displayName = useMemo(() => {
    if (profile?.firstName?.trim()) {
      return profile.firstName.trim();
    }

    const email = session?.user.email;
    if (email) {
      return email.split('@')[0] ?? 'Användare';
    }

    return 'Användare';
  }, [profile?.firstName, session?.user.email]);

  const email = session?.user.email ?? '—';

  const handleSignOut = useCallback(async () => {
    setErrorMessage(null);
    setIsSigningOut(true);

    const result = await signOut();

    setIsSigningOut(false);

    if (!result.ok) {
      setErrorMessage(result.error.message);
      return;
    }

    router.replace(routes.authSignIn);
  }, [signOut]);

  const navigateTodo = useCallback((destination: string) => {
    if (__DEV__) {
      console.warn(`[profile] TODO route: ${destination}`);
    }
  }, []);

  return (
    <ScreenContainer variant="profile">
      <View style={styles.root}>
        <ProfileMountainHeader />
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Profil</Text>

        <ProfileAccountHeaderCard
          name={displayName}
          email={email}
          onPress={() => navigateTodo('account-details')}
        />

        <ProfileSettingsSection title="Hälsa">
          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon="person-outline"
              title="Hälsoprofil"
              subtitle="Kön, aktivitetsnivå och kroppsmått"
              onPress={() => router.push(routes.profileHealthProfile)}
            />
            <ProfileSettingsDivider />
            <ProfileSettingsRow
              icon="watch-outline"
              title="Hälsodatakällor"
              subtitle="Garmin, Apple Health och Health Connect"
              onPress={() => router.push(routes.profileHealthDataSources)}
            />
            <ProfileSettingsDivider />
            <ProfileSettingsRow
              icon="resize-outline"
              title="Mätningar"
              subtitle="Se och hantera dina registrerade mätningar"
              onPress={() => router.push(routes.healthMeasurementHistory)}
            />
          </ProfileSettingsCard>
        </ProfileSettingsSection>

        <ProfileSettingsSection title="Konto">
          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon="star-outline"
              title="Abonnemang"
              subtitle="Hantera NORDYAN Premium"
              onPress={() => navigateTodo('subscription')}
            />
            <ProfileSettingsDivider />
            <ProfileSettingsRow
              icon="notifications-outline"
              title="Aviseringar"
              subtitle="Påminnelser och coachnotiser"
              onPress={() => navigateTodo('notifications')}
            />
            <ProfileSettingsDivider />
            <ProfileSettingsRow
              icon="shield-outline"
              title="Integritet och data"
              subtitle="Samtycke, export och datainställningar"
              onPress={() => navigateTodo('privacy-and-data')}
            />
          </ProfileSettingsCard>
        </ProfileSettingsSection>

        <ProfileSettingsSection title="Hjälp">
          <ProfileSettingsCard>
            <ProfileSettingsRow
              icon="help-circle-outline"
              title="Hjälp och support"
              subtitle="Vanliga frågor och kontakt"
              onPress={() => navigateTodo('help-and-support')}
            />
            <ProfileSettingsDivider />
            <ProfileSettingsRow
              icon="chatbox-outline"
              title="Ge feedback"
              subtitle="Hjälp oss förbättra NORDYAN"
              onPress={() => navigateTodo('feedback')}
            />
          </ProfileSettingsCard>
        </ProfileSettingsSection>

        <ProfileSettingsCard>
          <ProfileSettingsRow
            icon="log-out-outline"
            title={isSigningOut ? 'Loggar ut…' : 'Logga ut'}
            titleColor={colors.homeTextMuted}
            showChevron={false}
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
