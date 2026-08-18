import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import type { DevelopmentCoachView } from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentCoachCardProps = {
  coach: DevelopmentCoachView | null;
  /** When true, omit outer horizontal padding (parent already pads). */
  embedded?: boolean;
  /** Trends-only denser padding; Home keeps default. */
  compact?: boolean;
};

export function DevelopmentCoachCard({
  coach,
  embedded = false,
  compact = false,
}: DevelopmentCoachCardProps) {
  useI18n();

  return (
    <View style={[styles.section, embedded && styles.sectionEmbedded]}>
      <View style={[styles.card, compact && styles.cardCompact]}>
        <View style={styles.header}>
          <View style={styles.dot} />
          <Text
            style={[styles.tag, compact && styles.tagCompact]}
            maxFontSizeMultiplier={1.1}
          >
            {t('home.coach.title')}
          </Text>
        </View>

        {coach?.available ? (
          <View style={[styles.messageBlock, compact && styles.messageBlockCompact]}>
            <Text
              style={[styles.title, compact && styles.titleCompact]}
              maxFontSizeMultiplier={1.1}
            >
              {coach.title}
            </Text>
            <Text
              style={[styles.body, compact && styles.bodyCompact]}
              maxFontSizeMultiplier={1.1}
            >
              {coach.body}
            </Text>
          </View>
        ) : (
          <Text
            style={[styles.body, compact && styles.bodyCompact]}
            maxFontSizeMultiplier={1.1}
          >
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
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingVertical: developmentLayout.sectionPaddingVertical,
  },
  sectionEmbedded: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  card: {
    width: '100%',
    backgroundColor: colors.developmentCoachCardBackground,
    borderWidth: 1,
    borderColor: colors.brandAccent,
    borderRadius: developmentLayout.coachCardRadius,
    padding: developmentLayout.coachCardPadding,
    gap: developmentLayout.coachCardGap,
  },
  cardCompact: {
    padding: developmentLayout.trendsCoachCardPadding,
    gap: developmentLayout.trendsCoachCardGap,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: developmentLayout.coachHeaderGap,
  },
  dot: {
    width: developmentLayout.coachDotSize,
    height: developmentLayout.coachDotSize,
    borderRadius: developmentLayout.coachDotSize / 2,
    backgroundColor: colors.brandAccent,
  },
  tag: {
    flex: 1,
    color: colors.brandAccent,
    fontSize: developmentTypography.coachTagSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: developmentTypography.coachTagSize * 1.2,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  tagCompact: {
    fontSize: developmentTypography.trendsCoachTagSize,
    lineHeight: developmentTypography.trendsCoachTagSize * 1.2,
  },
  messageBlock: {
    gap: developmentLayout.coachMessageGap,
  },
  messageBlockCompact: {
    gap: 3,
  },
  title: {
    color: colors.developmentText,
    fontSize: developmentTypography.coachTitleSize,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: developmentTypography.coachTitleSize * 1.35,
    includeFontPadding: false,
  },
  titleCompact: {
    fontSize: developmentTypography.trendsCoachTitleSize,
    lineHeight: developmentTypography.trendsCoachTitleSize * 1.3,
  },
  body: {
    color: colors.developmentText,
    fontSize: developmentTypography.coachBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.coachBodySize * 1.4,
    includeFontPadding: false,
  },
  bodyCompact: {
    fontSize: developmentTypography.trendsCoachBodySize,
    lineHeight: developmentTypography.trendsCoachBodySize * 1.35,
  },
});
