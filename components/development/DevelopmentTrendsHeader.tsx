import { StyleSheet, View } from 'react-native';

import { OnboardingBackButton } from '@/components/onboarding';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentTrendsHeaderProps = {
  onBackPress: () => void;
};

export function DevelopmentTrendsHeader({ onBackPress }: DevelopmentTrendsHeaderProps) {
  useI18n();

  return (
    <View style={styles.header}>
      <OnboardingBackButton onPress={onBackPress} />

      <View style={styles.titleBlock}>
        <Text style={styles.title} maxFontSizeMultiplier={1.1}>
          {t('development.trends.title')}
        </Text>
        <Text style={styles.subtitle} maxFontSizeMultiplier={1.1}>
          {t('development.trends.headerSubtitle')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    gap: developmentLayout.trendsHeaderGap,
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingTop: developmentLayout.trendsHeaderPaddingTop,
    paddingBottom: 0,
  },
  titleBlock: {
    width: '100%',
    gap: developmentLayout.trendsHeaderTitleGap,
  },
  title: {
    color: colors.developmentText,
    fontSize: developmentTypography.trendsTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: developmentTypography.trendsTitleSize * 1.15,
    includeFontPadding: false,
  },
  subtitle: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.trendsSubtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.trendsSubtitleSize * 1.35,
    includeFontPadding: false,
  },
});
