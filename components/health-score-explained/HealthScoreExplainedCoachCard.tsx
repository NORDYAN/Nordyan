import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { HealthScoreExplainedCoachView } from '@/lib/presentation/health-score-explained';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

type HealthScoreExplainedCoachCardProps = {
  coach: HealthScoreExplainedCoachView | null;
};

export function HealthScoreExplainedCoachCard({ coach }: HealthScoreExplainedCoachCardProps) {
  useI18n();

  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {t('home.coach.title')}
      </Text>
      <View style={styles.card}>
        {coach?.available ? (
          <>
            <Text style={styles.title} maxFontSizeMultiplier={1.1}>
              {coach.title}
            </Text>
            <Text style={styles.body} maxFontSizeMultiplier={1.1}>
              {coach.body}
            </Text>
          </>
        ) : (
          <Text style={styles.body} maxFontSizeMultiplier={1.1}>
            {t('development.coachUnavailable')}
          </Text>
        )}
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
  card: {
    width: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: healthScoreExplainedLayout.coachCardRadius,
    padding: healthScoreExplainedLayout.coachCardPadding,
    gap: healthScoreExplainedLayout.coachCardGap,
  },
  title: {
    color: colors.developmentText,
    fontSize: healthScoreExplainedTypography.coachTitleSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: healthScoreExplainedTypography.coachTitleSize * 1.25,
    includeFontPadding: false,
  },
  body: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.coachBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthScoreExplainedTypography.coachBodySize * 1.35,
    includeFontPadding: false,
  },
});
