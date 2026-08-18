import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';

import { Text } from '@/components/ui/Text';
import { getDevelopmentFactorsCtaLabel } from '@/lib/presentation/development';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentFactorsCtaProps = {
  onPress: () => void;
};

export function DevelopmentFactorsCta({ onPress }: DevelopmentFactorsCtaProps) {
  useI18n();
  const label = getDevelopmentFactorsCtaLabel();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.label} maxFontSizeMultiplier={1.1}>
        {label}
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
    width: '100%',
    minHeight: 44,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsCtaRadius,
    paddingHorizontal: developmentLayout.trendsFactorsCtaPadding,
    paddingVertical: developmentLayout.trendsCtaPaddingVertical,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    flex: 1,
    color: colors.developmentText,
    fontSize: developmentTypography.trendsCtaSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.trendsCtaSize * 1.2,
    includeFontPadding: false,
  },
});
