import { StyleSheet, View } from 'react-native';

import { HealthScoreExplainedGauge } from '@/components/health-score-explained/HealthScoreExplainedGauge';
import { Text } from '@/components/ui/Text';
import type { HealthScoreExplainedScoreChangeView } from '@/lib/presentation/health-score-explained';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

type HealthScoreExplainedSummaryCardProps = {
  scoreDisplay: string;
  score?: number;
  bandLabel: string | null;
  scoreChange: HealthScoreExplainedScoreChangeView | null;
};

export function HealthScoreExplainedSummaryCard({
  scoreDisplay,
  score,
  bandLabel,
  scoreChange,
}: HealthScoreExplainedSummaryCardProps) {
  const pillTone =
    scoreChange?.status === 'ready' &&
    (scoreChange.direction === 'up' || scoreChange.direction === 'down')
      ? 'accent'
      : 'muted';

  const gaugeProps =
    scoreDisplay === '…' || scoreDisplay === '—' || score == null
      ? { scoreDisplay }
      : { score };

  return (
    <View style={styles.card}>
      <HealthScoreExplainedGauge {...gaugeProps} />
      <View style={styles.labels}>
        {bandLabel ? (
          <Text style={styles.band} maxFontSizeMultiplier={1.1}>
            {bandLabel}
          </Text>
        ) : null}
        {scoreChange ? (
          <View style={[styles.pill, pillTone === 'accent' ? styles.pillAccent : styles.pillMuted]}>
            <Text
              style={[
                styles.pillText,
                pillTone === 'accent' ? styles.pillTextAccent : styles.pillTextMuted,
              ]}
              maxFontSizeMultiplier={1.1}
            >
              {scoreChange.text}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    alignItems: 'center',
    gap: healthScoreExplainedLayout.summaryCardGap,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: healthScoreExplainedLayout.summaryCardRadius,
    padding: healthScoreExplainedLayout.summaryCardPadding,
  },
  labels: {
    width: '100%',
    alignItems: 'center',
    gap: healthScoreExplainedLayout.summaryLabelsGap,
  },
  band: {
    color: colors.developmentText,
    fontSize: healthScoreExplainedTypography.bandSize,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    textTransform: 'uppercase',
    includeFontPadding: false,
  },

  pill: {
    borderRadius: healthScoreExplainedLayout.changePillRadius,
    paddingHorizontal: healthScoreExplainedLayout.changePillPaddingHorizontal,
    paddingVertical: healthScoreExplainedLayout.changePillPaddingVertical,
    maxWidth: '100%',
  },
  pillAccent: {
    backgroundColor: colors.developmentAccentFill,
  },
  pillMuted: {
    backgroundColor: colors.developmentBackground,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
  },
  pillText: {
    fontSize: healthScoreExplainedTypography.changePillSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  pillTextAccent: {
    color: colors.developmentAccent,
  },
  pillTextMuted: {
    color: colors.developmentTextMuted,
  },
});
