import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  formatWeeklyCheckInProgress,
  getWeeklyCheckInProgressFraction,
  WEEKLY_CHECK_IN_COPY,
} from '@/lib/presentation/weekly-check-in';
import { typography } from '@/theme';
import {
  weeklyCheckInColors,
  weeklyCheckInLayout,
  weeklyCheckInTypography,
} from '@/theme/weekly-check-in';

type WeeklyCheckInProgressProps = {
  index: number;
};

export function WeeklyCheckInProgress({ index }: WeeklyCheckInProgressProps) {
  return (
    <View style={styles.root}>
      <View style={styles.labels}>
        <Text style={styles.label} maxFontSizeMultiplier={1.1}>
          {WEEKLY_CHECK_IN_COPY.progressLabel}
        </Text>
        <Text style={styles.count} maxFontSizeMultiplier={1.1}>
          {formatWeeklyCheckInProgress(index)}
        </Text>
      </View>
      <View style={styles.track}>
        <View
          style={[styles.fill, { width: `${getWeeklyCheckInProgressFraction(index) * 100}%` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
    gap: weeklyCheckInLayout.progressGap,
    paddingHorizontal: weeklyCheckInLayout.horizontalPadding,
    paddingVertical: weeklyCheckInLayout.progressPaddingVertical,
  },
  labels: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: weeklyCheckInColors.supportingGold,
    fontSize: weeklyCheckInTypography.progressSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    includeFontPadding: false,
  },
  count: {
    color: weeklyCheckInColors.muted,
    fontSize: weeklyCheckInTypography.progressSize,
    fontWeight: typography.fontWeight.semibold,
    includeFontPadding: false,
  },
  track: {
    width: '100%',
    height: weeklyCheckInLayout.progressTrackHeight,
    borderRadius: weeklyCheckInLayout.progressTrackRadius,
    backgroundColor: weeklyCheckInColors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: weeklyCheckInColors.supportingGold,
    borderRadius: weeklyCheckInLayout.progressTrackRadius,
  },
});
