import { StyleSheet, View } from 'react-native';

import { CoachAvatar } from '@/components/coach/CoachAvatar';
import { Text } from '@/components/ui/Text';
import { colors, coachLayout, coachTypography, typography } from '@/theme';

type CoachHomeHeaderProps = {
  title: string;
  coachLabel: string;
  coachSubtitle: string;
};

export function CoachHomeHeader({ title, coachLabel, coachSubtitle }: CoachHomeHeaderProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title} maxFontSizeMultiplier={1.1}>
        {title}
      </Text>
      <View style={styles.identityRow}>
        <CoachAvatar />
        <View style={styles.identityText}>
          <Text style={styles.coachLabel} maxFontSizeMultiplier={1.1}>
            {coachLabel}
          </Text>
          <Text style={styles.coachSubtitle} maxFontSizeMultiplier={1.1}>
            {coachSubtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: '100%',
    gap: coachLayout.headerGap,
    paddingHorizontal: coachLayout.horizontalPadding,
    paddingTop: coachLayout.headerPaddingTop,
  },
  title: {
    color: colors.developmentText,
    fontSize: coachTypography.screenTitleSize,
    fontWeight: typography.fontWeight.bold,
    lineHeight: coachTypography.screenTitleSize * 1.15,
    includeFontPadding: false,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: coachLayout.identityGap,
    minWidth: 0,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  coachLabel: {
    color: colors.brandAccent,
    fontSize: coachTypography.coachLabelSize,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
  coachSubtitle: {
    color: colors.developmentTextMuted,
    fontSize: coachTypography.coachSubtitleSize,
    fontWeight: typography.fontWeight.regular,
    includeFontPadding: false,
  },
});
