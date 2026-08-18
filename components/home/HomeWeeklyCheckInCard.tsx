import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { HOME_WEEKLY_CHECK_IN_COPY } from '@/lib/presentation/home';
import { colors, homeLayout, typography } from '@/theme';

type HomeWeeklyCheckInCardProps = {
  onPress: () => void;
};

export function HomeWeeklyCheckInCard({ onPress }: HomeWeeklyCheckInCardProps) {
  return (
    <Card padding={homeLayout.coachCardPadding} borderRadius={homeLayout.coachCardRadius} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Ionicons name="calendar-outline" size={18} color={colors.onboardingAccent} />
        </View>
        <Text style={styles.title}>{HOME_WEEKLY_CHECK_IN_COPY.title}</Text>
      </View>

      <Text style={styles.supporting}>{HOME_WEEKLY_CHECK_IN_COPY.supporting}</Text>
      <Text style={styles.body}>{HOME_WEEKLY_CHECK_IN_COPY.explanation}</Text>

      <View style={styles.timeRow}>
        <Ionicons name="time-outline" size={14} color={colors.homeTextMuted} />
        <Text style={styles.timeHint}>{HOME_WEEKLY_CHECK_IN_COPY.timeHint}</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={HOME_WEEKLY_CHECK_IN_COPY.cta}
        onPress={onPress}
        style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
      >
        <Text style={styles.actionLabel}>{HOME_WEEKLY_CHECK_IN_COPY.cta}</Text>
        <Ionicons name="chevron-forward" size={16} color={colors.onboardingButtonText} />
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.brandAccentFillSolid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: colors.onboardingText,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  supporting: {
    color: colors.homeAccentSlate,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  body: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeHint: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
  },
  actionButton: {
    minHeight: 44,
    borderRadius: 22,
    backgroundColor: colors.onboardingAccent,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButtonPressed: {
    opacity: 0.85,
  },
  actionLabel: {
    color: colors.onboardingButtonText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
