import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { DevelopmentScoreChangeView } from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentScoreHeroProps = {
  scoreDisplay: string;
  bandLabel: string;
  scoreChange: DevelopmentScoreChangeView | null;
};

export function DevelopmentScoreHero({
  scoreDisplay,
  bandLabel,
  scoreChange,
}: DevelopmentScoreHeroProps) {
  const pillTone =
    scoreChange?.status === 'ready' && scoreChange.tone === 'positive'
      ? 'positive'
      : scoreChange?.status === 'ready' && scoreChange.tone === 'negative'
        ? 'negative'
        : 'neutral';

  return (
    <View style={styles.hero}>
      <View style={styles.ring}>
        <Text style={styles.score} maxFontSizeMultiplier={1}>
          {scoreDisplay}
        </Text>
        {bandLabel ? (
          <Text style={styles.band} maxFontSizeMultiplier={1.1}>
            {bandLabel}
          </Text>
        ) : null}
      </View>

      {scoreChange ? (
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
            {scoreChange.text}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    width: '100%',
    alignItems: 'center',
    gap: developmentLayout.heroGap,
    paddingTop: developmentLayout.heroPaddingTop,
    paddingBottom: developmentLayout.heroPaddingBottom,
    paddingHorizontal: developmentLayout.horizontalPadding,
  },
  ring: {
    width: developmentLayout.scoreRingSize,
    height: developmentLayout.scoreRingSize,
    borderRadius: developmentLayout.scoreRingSize / 2,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    backgroundColor: colors.developmentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  score: {
    color: colors.developmentText,
    fontSize: developmentTypography.scoreSize,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: developmentTypography.scoreSize * 0.95,
    textAlign: 'center',
    includeFontPadding: false,
  },
  band: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.scoreBandSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.scoreBandSize * 1.2,
    textTransform: 'uppercase',
    textAlign: 'center',
    includeFontPadding: false,
  },
  pill: {
    borderRadius: developmentLayout.changePillRadius,
    paddingHorizontal: developmentLayout.changePillPaddingHorizontal,
    paddingVertical: developmentLayout.changePillPaddingVertical,
    maxWidth: '100%',
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
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
  },
  pillText: {
    fontSize: developmentTypography.changePillSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.changePillSize * 1.2,
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
