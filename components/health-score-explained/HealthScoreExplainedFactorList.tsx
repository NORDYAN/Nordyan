import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import type { HealthScoreExplainedFactorCard } from '@/lib/presentation/health-score-explained';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

type HealthScoreExplainedFactorListProps = {
  factors: HealthScoreExplainedFactorCard[];
};

function statusColor(tone: HealthScoreExplainedFactorCard['tone']): string {
  switch (tone) {
    case 'positive':
      return colors.developmentAccent;
    case 'negative':
      return colors.onboardingErrorText;
    case 'limitation':
      return '#F59E0B';
    case 'neutral':
    default:
      return colors.developmentTextMuted;
  }
}

function dotColor(tone: HealthScoreExplainedFactorCard['tone']): string {
  switch (tone) {
    case 'positive':
      return colors.developmentAccent;
    case 'negative':
      return colors.onboardingErrorText;
    case 'limitation':
      return '#F59E0B';
    case 'neutral':
    default:
      return colors.developmentTextMuted;
  }
}

export function HealthScoreExplainedFactorList({
  factors,
}: HealthScoreExplainedFactorListProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {t('explained.factorsHeading')}
      </Text>
      <View style={styles.list}>
        {factors.map((factor) => (
          <View key={factor.id} style={styles.card}>
            <View style={[styles.dot, { backgroundColor: dotColor(factor.tone) }]} />
            <View style={styles.content}>
              <View style={styles.titleRow}>
                <Text style={styles.label} maxFontSizeMultiplier={1.1}>
                  {factor.label}
                </Text>
                <Text
                  style={[styles.status, { color: statusColor(factor.tone) }]}
                  maxFontSizeMultiplier={1.1}
                >
                  {factor.statusLabel}
                </Text>
              </View>
              <Text style={styles.body} maxFontSizeMultiplier={1.1}>
                {factor.body}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    gap: healthScoreExplainedLayout.sectionHeadingGap,
  },
  heading: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.sectionHeadingSize,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    paddingBottom: healthScoreExplainedLayout.sectionHeadingPaddingBottom,
    includeFontPadding: false,
  },
  list: {
    width: '100%',
    gap: healthScoreExplainedLayout.factorCardGap,
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: healthScoreExplainedLayout.factorCardInnerGap,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: healthScoreExplainedLayout.factorCardRadius,
    paddingHorizontal: healthScoreExplainedLayout.factorCardPaddingHorizontal,
    paddingVertical: healthScoreExplainedLayout.factorCardPaddingVertical,
  },
  dot: {
    width: healthScoreExplainedLayout.factorDotSize,
    height: healthScoreExplainedLayout.factorDotSize,
    borderRadius: healthScoreExplainedLayout.factorDotSize / 2,
    marginTop: 4,
  },
  content: {
    flex: 1,
    gap: healthScoreExplainedLayout.factorContentGap,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 8,
  },
  label: {
    color: colors.developmentText,
    fontSize: healthScoreExplainedTypography.factorLabelSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  status: {
    fontSize: healthScoreExplainedTypography.factorStatusSize,
    fontWeight: typography.fontWeight.medium,
    textTransform: 'uppercase',
    includeFontPadding: false,
    flexShrink: 1,
    textAlign: 'right',
  },
  body: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.factorBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthScoreExplainedTypography.factorBodySize * 1.3,
    includeFontPadding: false,
  },
});
