import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { DevelopmentPeriodOption } from '@/lib/presentation/development';
import type { DevelopmentPeriod } from '@/lib/services/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentPeriodSelectorProps = {
  options: readonly DevelopmentPeriodOption[];
  selected: DevelopmentPeriod;
  onSelect: (period: DevelopmentPeriod) => void;
};

export function DevelopmentPeriodSelector({
  options,
  selected,
  onSelect,
}: DevelopmentPeriodSelectorProps) {
  return (
    <View style={styles.container}>
      {options.map((option) => {
        const isSelected = option.id === selected;
        return (
          <Pressable
            key={option.id}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={option.label}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.optionPressed,
            ]}
          >
            <Text
              style={[styles.label, isSelected ? styles.labelSelected : styles.labelIdle]}
              maxFontSizeMultiplier={1.1}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: developmentLayout.trendsPeriodSelectorHeight,
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsPeriodSelectorHeight / 2,
    padding: developmentLayout.trendsPeriodSelectorPadding,
  },
  option: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: developmentLayout.trendsPeriodOptionRadius,
  },
  optionSelected: {
    backgroundColor: colors.brandAccentFill,
  },
  optionPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: developmentTypography.trendsPeriodOptionSize,
    includeFontPadding: false,
  },
  labelSelected: {
    color: colors.brandAccent,
    fontWeight: typography.fontWeight.semibold,
  },
  labelIdle: {
    color: colors.developmentTextMuted,
    fontWeight: typography.fontWeight.medium,
  },
});
