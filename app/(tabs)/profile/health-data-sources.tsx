import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { HealthSourceCard } from '@/components/profile/HealthSourceCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  buildIntegrationSuggestionMailto,
  openMailtoUrl,
} from '@/lib/presentation/support-mail';
import { colors, profileHealthDataSourcesLayout, typography } from '@/theme';

export default function HealthDataSourcesScreen() {
  useI18n();

  return (
    <ScreenContainer variant="healthDataSources" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.navRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name="chevron-back"
              size={profileHealthDataSourcesLayout.backIconSize}
              color={colors.onboardingText}
            />
          </Pressable>
        </View>

        <View style={styles.headerBlock}>
          <Text style={styles.title}>{t('health.sources.title')}</Text>
          <Text style={styles.subtitle}>{t('health.sources.subtitle')}</Text>
        </View>

        <View style={styles.sourcesList}>
          <HealthSourceCard
            icon="heart-outline"
            title="Apple Health"
            description={t('health.sources.apple.description')}
            status="comingSoon"
          />
          <HealthSourceCard
            icon="git-network-outline"
            title="Health Connect (Android)"
            description={t('health.sources.healthConnect.description')}
            status="comingSoon"
          />
          <HealthSourceCard
            icon="watch-outline"
            title="Garmin Connect"
            description={t('health.sources.garmin.description')}
            status="comingSoon"
          />
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIconBox}>
            <Ionicons
              name="shield-outline"
              size={profileHealthDataSourcesLayout.privacyIconSize}
              color={colors.profileHealthDataSourceAccent}
            />
          </View>
          <View style={styles.privacyTextBlock}>
            <Text style={styles.privacyTitle}>{t('health.sources.privacyTitle')}</Text>
            <Text style={styles.privacyBody}>{t('health.sources.privacyBody')}</Text>
          </View>
        </View>

        <View style={styles.suggestBlock}>
          <Text style={styles.suggestHeading}>{t('health.sources.suggest.heading')}</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={t('health.sources.suggest.action')}
            onPress={() => {
              void openMailtoUrl(buildIntegrationSuggestionMailto());
            }}
            style={({ pressed }) => [styles.suggestAction, pressed && styles.suggestActionPressed]}
          >
            <Text style={styles.suggestActionLabel}>{t('health.sources.suggest.action')}</Text>
          </Pressable>
        </View>

        <Text style={styles.footerNote}>{t('health.sources.footer')}</Text>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: profileHealthDataSourcesLayout.sectionGap,
    paddingHorizontal: profileHealthDataSourcesLayout.horizontalPadding,
    paddingTop: profileHealthDataSourcesLayout.scrollPaddingTop,
    paddingBottom: profileHealthDataSourcesLayout.scrollPaddingBottom,
  },
  navRow: {
    width: '100%',
  },
  backButton: {
    width: profileHealthDataSourcesLayout.backTouchSize,
    height: profileHealthDataSourcesLayout.backTouchSize,
    borderRadius: profileHealthDataSourcesLayout.connectButtonRadius,
    padding: profileHealthDataSourcesLayout.backTouchPadding,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.75,
  },
  headerBlock: {
    gap: profileHealthDataSourcesLayout.headerGap,
    width: '100%',
  },
  title: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.titleFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight:
      profileHealthDataSourcesLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.subtitleFontSize * typography.lineHeight.normal,
    width: '100%',
  },
  sourcesList: {
    gap: profileHealthDataSourcesLayout.sourcesListGap,
    width: '100%',
  },
  privacyCard: {
    flexDirection: 'row',
    gap: profileHealthDataSourcesLayout.privacyCardGap,
    backgroundColor: colors.profileHealthDataSourceCardBackground,
    borderWidth: 1,
    borderColor: colors.profileHealthDataSourceCardBorder,
    borderRadius: profileHealthDataSourcesLayout.privacyCardRadius,
    padding: profileHealthDataSourcesLayout.privacyCardPadding,
    width: '100%',
  },
  privacyIconBox: {
    width: profileHealthDataSourcesLayout.privacyIconBoxSize,
    height: profileHealthDataSourcesLayout.privacyIconBoxSize,
    borderRadius: profileHealthDataSourcesLayout.privacyIconBoxRadius,
    backgroundColor: colors.profileHealthDataSourceIconBox,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyTextBlock: {
    flex: 1,
    gap: profileHealthDataSourcesLayout.sourceCardTextGap,
    minWidth: 0,
  },
  privacyTitle: {
    color: colors.onboardingText,
    fontSize: profileHealthDataSourcesLayout.privacyTitleSize,
    fontWeight: typography.fontWeight.semibold,
  },
  privacyBody: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.privacyBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.privacyBodySize * typography.lineHeight.relaxed,
  },
  suggestBlock: {
    width: '100%',
    gap: 6,
    alignItems: 'center',
  },
  suggestHeading: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.footerNoteSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.footerNoteSize * typography.lineHeight.relaxed,
    textAlign: 'center',
  },
  suggestAction: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  suggestActionPressed: {
    opacity: 0.75,
  },
  suggestActionLabel: {
    color: colors.profileHealthDataSourceAccent,
    fontSize: profileHealthDataSourcesLayout.privacyTitleSize,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  footerNote: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.footerNoteSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight:
      profileHealthDataSourcesLayout.footerNoteSize * typography.lineHeight.relaxed,
    textAlign: 'center',
    width: '100%',
  },
});
