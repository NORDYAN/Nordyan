import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentHomeHeaderProps = {
  subtitle?: string;
};

export function DevelopmentHomeHeader({
  subtitle,
}: DevelopmentHomeHeaderProps) {
  useI18n();

  return (
    <View style={styles.header}>
      <View style={styles.titleBlock}>
        <Text
          style={styles.title}
          maxFontSizeMultiplier={1.1}
        >
          {t('development.home.title')}
        </Text>
        <Text
          style={styles.subtitle}
          maxFontSizeMultiplier={1.1}
        >
          {subtitle ?? t('development.home.subtitle')}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    gap: developmentLayout.headerGap,
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingTop: developmentLayout.headerPaddingTop,
    paddingBottom: developmentLayout.headerPaddingBottom,
  },
  titleBlock: {
    width: '100%',
    gap: developmentLayout.headerTitleGap,
  },
  title: {
    color: colors.developmentText,
    fontSize: developmentTypography.titleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: developmentTypography.titleSize * 1.15,
    includeFontPadding: false,
  },
  subtitle: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
});
