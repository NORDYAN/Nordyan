import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors, profileHealthDataSourcesLayout, typography } from '@/theme';

type ProfileFutureFeatureScreenProps = {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  contextTitle?: string;
  contextBody?: string;
  footer: string;
};

export function ProfileFutureFeatureScreen({
  title,
  subtitle,
  children,
  contextTitle,
  contextBody,
  footer,
}: ProfileFutureFeatureScreenProps) {
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <View style={styles.sourcesList}>{children}</View>

        {contextTitle && contextBody ? (
          <View style={styles.privacyCard}>
            <View style={styles.privacyIconBox}>
              <Ionicons
                name="shield-outline"
                size={profileHealthDataSourcesLayout.privacyIconSize}
                color={colors.profileHealthDataSourceAccent}
              />
            </View>
            <View style={styles.privacyTextBlock}>
              <Text style={styles.privacyTitle}>{contextTitle}</Text>
              <Text style={styles.privacyBody}>{contextBody}</Text>
            </View>
          </View>
        ) : null}

        <Text style={styles.footerNote}>{footer}</Text>
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
    lineHeight: profileHealthDataSourcesLayout.titleFontSize * typography.lineHeight.tight,
  },
  subtitle: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.subtitleFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: profileHealthDataSourcesLayout.subtitleFontSize * typography.lineHeight.normal,
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
    lineHeight: profileHealthDataSourcesLayout.privacyBodySize * typography.lineHeight.relaxed,
  },
  footerNote: {
    color: colors.profileHealthDataSourceTextMuted,
    fontSize: profileHealthDataSourcesLayout.footerNoteSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: profileHealthDataSourcesLayout.footerNoteSize * typography.lineHeight.relaxed,
    textAlign: 'center',
    width: '100%',
  },
});
