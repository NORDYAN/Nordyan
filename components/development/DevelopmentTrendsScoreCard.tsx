import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { DevelopmentPeriodChangeView } from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentTrendsScoreCardProps = {
  scoreDisplay: string;
  bandLabel: string | null;
  periodChange: DevelopmentPeriodChangeView | null;
};

export function DevelopmentTrendsScoreCard({
  scoreDisplay,
  bandLabel,
  periodChange,
}: DevelopmentTrendsScoreCardProps) {
  const pillTone =
    periodChange?.status === 'ready' && periodChange.tone === 'positive'
      ? 'positive'
      : periodChange?.status === 'ready' && periodChange.tone === 'negative'
        ? 'negative'
        : 'neutral';

  return (
    <View style={styles.card}>
      <View style={styles.stats}>
        <View style={styles.scoreRow}>
          <Text style={styles.score} maxFontSizeMultiplier={1}>
            {scoreDisplay}
          </Text>
          <Text style={styles.max} maxFontSizeMultiplier={1.1}>
            / 100
          </Text>
        </View>
        {bandLabel ? (
          <Text style={styles.band} maxFontSizeMultiplier={1.1}>
            {bandLabel}
          </Text>
        ) : null}
      </View>

      {periodChange ? (
        <View
          style={[
            styles.pill,
            pillTone === 'positive'
              ? styles.pillPositive
              : pillTone === 'negative'
                ? styles.pillNegative
                : styles.pillMuted,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              pillTone === 'positive'
                ? styles.pillTextPositive
                : pillTone === 'negative'
                  ? styles.pillTextNegative
                  : styles.pillTextMuted,
            ]}
            maxFontSizeMultiplier={1.1}
          >
            {periodChange.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: developmentLayout.trendsScoreCardGap,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsScoreCardRadius,
    padding: developmentLayout.trendsScoreCardPadding,
  },
  stats: {
    flexShrink: 1,
    gap: 2,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  score: {
    color: colors.developmentText,
    fontSize: developmentTypography.trendsScoreValueSize,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: developmentTypography.trendsScoreValueSize * 0.95,
    includeFontPadding: false,
  },
  max: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.trendsScoreMaxSize,
    fontWeight: typography.fontWeight.medium,
    includeFontPadding: false,
  },
  band: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.trendsScoreBandSize,
    fontWeight: typography.fontWeight.bold,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  pill: {
    borderRadius: developmentLayout.trendsChangePillRadius,
    paddingHorizontal: developmentLayout.trendsChangePillPaddingHorizontal,
    paddingVertical: developmentLayout.trendsChangePillPaddingVertical,
    maxWidth: '52%',
  },
  pillPositive: {
    backgroundColor: colors.developmentAccentFill,
  },
  pillNegative: {
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.onboardingErrorText,
  },
  pillMuted: {
    backgroundColor: colors.developmentBackground,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
  },
  pillText: {
    fontSize: developmentTypography.trendsChangePillSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.trendsChangePillSize * 1.2,
    includeFontPadding: false,
  },
  pillTextPositive: {
    color: colors.developmentAccent,
  },
  pillTextNegative: {
    color: colors.onboardingErrorText,
  },
  pillTextMuted: {
    color: colors.developmentTextMuted,
  },
});
