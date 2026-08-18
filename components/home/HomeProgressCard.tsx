import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import {
  formatHomeProgressDeltaLabel,
  getHomeProgressInsufficientLine1,
  getHomeProgressInsufficientLine2,
  type HomeProgressFetchState,
} from '@/lib/presentation/home';
import { colors, homeLayout, homeTypography, typography } from '@/theme';

type HomeProgressCardProps = {
  state: HomeProgressFetchState;
};

export function HomeProgressCard({ state }: HomeProgressCardProps) {
  if (state.status === 'loading') {
    return (
      <Card
        padding={homeLayout.coachCardPadding}
        borderRadius={homeLayout.coachCardRadius}
        style={styles.card}
      >
        <Text style={styles.score}>…</Text>
        <Text style={styles.delta}>…</Text>
      </Card>
    );
  }

  if (state.status === 'unavailable') {
    return (
      <Card
        padding={homeLayout.coachCardPadding}
        borderRadius={homeLayout.coachCardRadius}
        style={styles.card}
      >
        <Text style={styles.score}>—</Text>
        <Text style={styles.message}>{state.message}</Text>
      </Card>
    );
  }

  const { summary } = state;

  if (summary.trend === 'insufficient_history') {
    return (
      <Card
        padding={homeLayout.coachCardPadding}
        borderRadius={homeLayout.coachCardRadius}
        style={styles.card}
      >
        <View style={styles.insufficientBlock}>
          <Text style={styles.message}>{getHomeProgressInsufficientLine1()}</Text>
          <Text style={styles.message}>{getHomeProgressInsufficientLine2()}</Text>
        </View>
      </Card>
    );
  }

  const deltaLabel = formatHomeProgressDeltaLabel(summary);

  return (
    <Card
      padding={homeLayout.coachCardPadding}
      borderRadius={homeLayout.coachCardRadius}
      style={styles.card}
    >
      <Text style={styles.score}>{summary.currentScore}</Text>
      {deltaLabel ? <Text style={styles.delta}>{deltaLabel}</Text> : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 8,
  },
  score: {
    color: colors.onboardingText,
    fontSize: homeTypography.metricValueSize,
    fontWeight: typography.fontWeight.medium,
    lineHeight: 23,
  },
  delta: {
    color: colors.homeAccentSlate,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  message: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.light,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  insufficientBlock: {
    gap: 4,
  },
});
