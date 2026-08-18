import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachFocusCardProps = {
  sectionLabel: string;
  title: string;
  body: string;
};

export function CoachFocusCard({ sectionLabel, title, body }: CoachFocusCardProps) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading} maxFontSizeMultiplier={1.1}>
        {sectionLabel}
      </Text>
      <View style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.dot} />
          <Text style={styles.title} maxFontSizeMultiplier={1.1}>
            {title}
          </Text>
        </View>
        <Text style={styles.body} maxFontSizeMultiplier={1.1}>
          {body}
        </Text>
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minWidth: 0,
  },
  dot: {
    width: 8,
    height: 8,
    flexShrink: 0,
    borderRadius: 4,
    backgroundColor: colors.brandAccent,
  },
  title: {
    flex: 1,
    minWidth: 0,
    color: colors.developmentText,
    fontSize: coachTypography.focusTitleSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  body: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.focusBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: coachTypography.focusBodySize * 1.35,
    includeFontPadding: false,
  },
});
