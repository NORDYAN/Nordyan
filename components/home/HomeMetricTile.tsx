import { StyleSheet } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { colors, homeLayout, homeTypography, typography } from '@/theme';

type HomeMetricTileProps = {
  label: string;
  value: string;
  changeLabel: string;
  caption?: string;
};

export function HomeMetricTile({ label, value, changeLabel, caption }: HomeMetricTileProps) {
  return (
    <Card
      padding={homeLayout.metricCardPadding}
      borderRadius={homeLayout.metricCardRadius}
      style={styles.card}
    >
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.changeLabel}>{changeLabel}</Text>
      {caption ? <Text style={styles.caption}>{caption}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    gap: 12,
  },
  label: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  value: {
    color: colors.onboardingText,
    fontSize: homeTypography.metricValueSize,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 23,
  },
  changeLabel: {
    color: colors.homeAccentSlate,
    fontSize: homeTypography.metricChangeSize,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 14,
  },
  caption: {
    color: colors.homeTextDim,
    fontSize: homeTypography.metricCaptionSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: 14,
  },
});
