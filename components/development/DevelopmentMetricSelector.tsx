import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { DevelopmentMetricOption } from '@/lib/presentation/development';
import type { DevelopmentTrendMetric } from '@/lib/services/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentMetricSelectorProps = {
  options: readonly DevelopmentMetricOption[];
  selected: DevelopmentTrendMetric;
  onSelect: (metric: DevelopmentTrendMetric) => void;
};

export function DevelopmentMetricSelector({
  options,
  selected,
  onSelect,
}: DevelopmentMetricSelectorProps) {
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
              styles.pill,
              isSelected ? styles.pillSelected : styles.pillIdle,
              pressed && styles.pillPressed,
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
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: developmentLayout.trendsMetricGap,
  },
  pill: {
    borderRadius: developmentLayout.trendsMetricPillRadius,
    borderWidth: 1,
    paddingHorizontal: developmentLayout.trendsMetricPillPaddingHorizontal,
    paddingVertical: developmentLayout.trendsMetricPillPaddingVertical,
  },
  pillSelected: {
    backgroundColor: colors.brandAccent,
    borderColor: colors.brandAccent,
  },
  pillIdle: {
    backgroundColor: colors.developmentSurface,
    borderColor: colors.developmentBorder,
  },
  pillPressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: developmentTypography.trendsMetricPillSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  labelSelected: {
    color: colors.onboardingButtonText,
  },
  labelIdle: {
    color: colors.developmentTextMuted,
  },
});
