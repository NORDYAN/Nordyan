import { StyleSheet, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, onboardingResultLayout, typography } from '@/theme';

type OnboardingResultMetricCardProps = {
  label: string;
  caption: string;
  value: string;
  valueSuffix?: string;
  valueVariant?: 'bodyFat' | 'healthScore';
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
  valueRowStyle?: StyleProp<ViewStyle>;
};

export function OnboardingResultMetricCard({
  label,
  caption,
  value,
  valueSuffix,
  valueVariant = 'healthScore',
  style,
  valueStyle,
  valueRowStyle,
}: OnboardingResultMetricCardProps) {
  const valueFontSize =
    valueVariant === 'bodyFat'
      ? onboardingResultLayout.bodyFatValueFontSize
      : onboardingResultLayout.healthScoreValueFontSize;

  return (
    <View style={[styles.card, style]}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.caption}>{caption}</Text>
      </View>
      <View style={[styles.valueRow, valueRowStyle]}>
        <Text
          style={[
            styles.value,
            { fontSize: valueFontSize, lineHeight: valueFontSize * typography.lineHeight.tight },
            valueStyle,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
        {valueSuffix ? <Text style={styles.valueSuffix}>{valueSuffix}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.onboardingProfileFormBackground,
    borderRadius: onboardingResultLayout.metricCardRadius,
    borderWidth: 1,
    borderColor: colors.onboardingProfileFormBorder,
    padding: onboardingResultLayout.metricCardPadding,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  copy: {
    flex: 1,
    gap: onboardingResultLayout.metricCopyGap,
    paddingRight: onboardingResultLayout.metricCardPadding,
    flexShrink: 1,
  },
  label: {
    color: colors.onboardingProfileLabel,
    fontSize: onboardingResultLayout.metricLabelFontSize,
    fontWeight: typography.fontWeight.semibold,
  },
  caption: {
    color: colors.onboardingTextMuted,
    fontSize: onboardingResultLayout.metricLabelFontSize,
    fontWeight: typography.fontWeight.regular,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexShrink: 0,
  },
  value: {
    color: colors.onboardingAccent,
    fontWeight: typography.fontWeight.bold,
  },
  valueSuffix: {
    color: colors.onboardingProfileLabel,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.tight,
  },
});
