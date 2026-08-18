import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentTrendsCtaProps = {
  onPress: () => void;
};

export function DevelopmentTrendsCta({ onPress }: DevelopmentTrendsCtaProps) {
  useI18n();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('development.trends.cta')}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.1}>
        {t('development.trends.cta')}
      </Text>
      <Ionicons
        name="chevron-forward"
        size={developmentLayout.trendsCtaIconSize}
        color={colors.developmentText}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: developmentLayout.horizontalPadding,
    marginVertical: developmentLayout.trendsCtaMarginVertical,
    minHeight: 44,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsCtaRadius,
    paddingHorizontal: developmentLayout.trendsCtaPaddingHorizontal,
    paddingVertical: developmentLayout.trendsCtaPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    color: colors.developmentText,
    fontSize: developmentTypography.trendsCtaSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.trendsCtaSize * 1.2,
    includeFontPadding: false,
  },
});
