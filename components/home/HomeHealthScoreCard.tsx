import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { HomeHealthScoreGauge } from '@/components/home/HomeHealthScoreGauge';
import { colors, homeLayout, typography } from '@/theme';

export type HomeHealthScoreCardState =
  | { status: 'loading' }
  | { status: 'ready'; score: number; subtitle: string }
  | { status: 'unavailable'; message: string };

type HomeHealthScoreCardProps = {
  state: HomeHealthScoreCardState;
};

export function HomeHealthScoreCard({ state }: HomeHealthScoreCardProps) {
  const gaugeProps =
    state.status === 'ready'
      ? { score: state.score }
      : state.status === 'loading'
        ? { scoreDisplay: '…' }
        : { scoreDisplay: '—' };

  const subtitle =
    state.status === 'ready'
      ? state.subtitle
      : state.status === 'unavailable'
        ? state.message
        : '';

  return (
    <Card
      padding={homeLayout.healthScoreCardPadding}
      borderRadius={homeLayout.healthScoreCardRadius}
      elevated
      style={styles.card}
    >
      <HomeHealthScoreGauge {...gaugeProps} />
      <View style={styles.labels}>
        <Text style={styles.title}>NORDYAN Health Score</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    gap: homeLayout.healthScoreCardGap,
  },
  labels: {
    width: '100%',
    alignItems: 'center',
    gap: 4,
  },
  title: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.homeAccentSlate,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
});
