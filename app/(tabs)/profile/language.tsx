import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, View } from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { ProfileSettingsCard, ProfileSettingsDivider, ProfileSettingsRow } from '@/components/profile';
import { Text } from '@/components/ui/Text';
import { APP_LOCALES, t, type AppLocale } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  colors,
  profileHealthProfileLayout,
  profileLayout,
  profileTypography,
  typography,
} from '@/theme';

const LANGUAGE_LABEL_KEY = {
  sv: 'profile.language.sv',
  nb: 'profile.language.nb',
} as const;

export default function ProfileLanguageScreen() {
  const { locale, setLocale } = useI18n();

  return (
    <ScreenContainer variant="profile">
      <StatusBar style="light" />
      <View style={styles.navBar}>
        <OnboardingBackButton onPress={() => router.back()} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>{t('profile.language.title')}</Text>
        <Text style={styles.subtitle}>{t('profile.language.subtitle')}</Text>
        <ProfileSettingsCard>
          {APP_LOCALES.map((option: AppLocale, index) => (
            <View key={option}>
              {index > 0 ? <ProfileSettingsDivider /> : null}
              <ProfileSettingsRow
                icon={locale === option ? 'checkmark-circle' : 'ellipse-outline'}
                title={t(LANGUAGE_LABEL_KEY[option])}
                showChevron={false}
                onPress={() => {
                  void setLocale(option);
                }}
                accessibilityLabel={t(LANGUAGE_LABEL_KEY[option])}
              />
            </View>
          ))}
        </ProfileSettingsCard>
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
    gap: profileLayout.sectionGap,
    paddingHorizontal: profileLayout.horizontalPadding,
    paddingTop: profileHealthProfileLayout.scrollPaddingTop,
    paddingBottom: profileLayout.scrollBottomPadding,
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileTypography.screenTitleSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: profileTypography.screenTitleSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.homeTextMuted,
    fontSize: profileTypography.rowSubtitleSize,
    fontWeight: typography.fontWeight.regular,
  },
});
