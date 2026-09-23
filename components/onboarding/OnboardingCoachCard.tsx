import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import { colors, onboardingResultLayout, typography } from '@/theme';

type OnboardingCoachCardProps = {
  headline: string;
  message: string;
};

export function OnboardingCoachCard({ headline, message }: OnboardingCoachCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="sparkles" size={16} color={colors.onboardingAccent} />
        <Text style={styles.headerLabel}>{t('onboarding.coach.label')}</Text>
      </View>
      <View style={styles.recommendation}>
        <Text style={styles.headline}>{headline}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.onboardingCoachCardBackground,
    borderRadius: onboardingResultLayout.metricCardRadius,
    borderWidth: 1,
    borderColor: colors.onboardingCoachCardBorder,
    padding: onboardingResultLayout.coachCardPadding,
    gap: onboardingResultLayout.coachLabelToHeadlineGap,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: onboardingResultLayout.coachHeaderGap,
  },
  headerLabel: {
    color: colors.onboardingAccent,
    fontSize: onboardingResultLayout.coachHeaderFontSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: onboardingResultLayout.coachHeaderLetterSpacing,
    textTransform: 'uppercase',
  },
  recommendation: {
    gap: onboardingResultLayout.coachCardGap,
  },
  headline: {
    color: colors.onboardingText,
    fontSize: onboardingResultLayout.coachHeadlineFontSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: onboardingResultLayout.coachHeadlineFontSize * 1.3,
  },
  message: {
    color: colors.onboardingProfileLabel,
    fontSize: onboardingResultLayout.coachBodyFontSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: onboardingResultLayout.coachBodyFontSize * typography.lineHeight.normal,
  },
});
