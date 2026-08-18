import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import type { CoachHomeViewModel } from '@/lib/presentation/coach-home';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachPlanCardProps = {
  plan: CoachHomeViewModel['plan'];
};

export function CoachPlanCard({ plan }: CoachPlanCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {plan.sectionLabel}
      </Text>
      <View style={styles.card}>
        {plan.available ? (
          <>
            <View style={styles.headerRow}>
              <Text style={styles.title} maxFontSizeMultiplier={1.1}>
                {plan.title}
              </Text>
              <View style={styles.durationPill}>
                <Text style={styles.durationText} maxFontSizeMultiplier={1.1}>
                  {plan.durationText}
                </Text>
              </View>
            </View>
            <Text style={styles.description} maxFontSizeMultiplier={1.1}>
              {plan.description}
            </Text>
            <View style={styles.footerRow}>
              <Text style={styles.frequency} maxFontSizeMultiplier={1.1}>
                {plan.frequencyText}
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.description} maxFontSizeMultiplier={1.1}>
            {plan.unavailableMessage}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    maxWidth: '100%',
    gap: coachLayout.sectionHeadingGap,
  },
  heading: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.sectionHeadingSize,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  card: {
    width: '100%',
    maxWidth: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: coachLayout.cardRadius,
    padding: coachLayout.cardPadding,
    gap: coachLayout.cardGap,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: coachLayout.planHeaderGap,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: colors.developmentText,
    fontSize: coachTypography.planTitleSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  durationPill: {
    flexShrink: 0,
    borderRadius: coachLayout.durationPillRadius,
    paddingHorizontal: coachLayout.durationPillPaddingHorizontal,
    paddingVertical: coachLayout.durationPillPaddingVertical,
    backgroundColor: colors.brandAccentFill,
  },
  durationText: {
    color: colors.brandAccent,
    fontSize: coachTypography.planDurationSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  description: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.planBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: coachTypography.planBodySize * 1.35,
    includeFontPadding: false,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  frequency: {
    flex: 1,
    color: colors.developmentTextMuted,
    fontSize: coachTypography.planFrequencySize,
    fontWeight: typography.fontWeight.medium,
    includeFontPadding: false,
  },
});
