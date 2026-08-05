import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import { colors, homeTypography, typography } from '@/theme';

const GAUGE_SIZE = 160;
const STROKE_WIDTH = 8;
const RADIUS = (GAUGE_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const ARC_RATIO = 0.72;
const ARC_LENGTH = CIRCUMFERENCE * ARC_RATIO;

type HomeHealthScoreGaugeProps = {
  score?: number;
  scoreDisplay?: string;
  maxScore?: number;
};

export function HomeHealthScoreGauge({
  score = 0,
  scoreDisplay,
  maxScore = 100,
}: HomeHealthScoreGaugeProps) {
  const progress =
    scoreDisplay !== undefined ? 0 : Math.min(Math.max(score / maxScore, 0), 1);
  const progressLength = ARC_LENGTH * progress;
  const centerLabel = scoreDisplay ?? String(score);

  return (
    <View style={styles.glow}>
      <View style={styles.wrapper}>
        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            stroke="#2C2C31"
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${ARC_LENGTH} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            rotation={128}
            origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
          />
          <Circle
            cx={GAUGE_SIZE / 2}
            cy={GAUGE_SIZE / 2}
            r={RADIUS}
            stroke={colors.homeAccentSlate}
            strokeWidth={STROKE_WIDTH}
            fill="none"
            strokeDasharray={`${progressLength} ${CIRCUMFERENCE}`}
            strokeLinecap="round"
            rotation={128}
            origin={`${GAUGE_SIZE / 2}, ${GAUGE_SIZE / 2}`}
          />
        </Svg>
        <View style={styles.centerText}>
          <Text style={styles.score}>{centerLabel}</Text>
          <Text style={styles.maxLabel}>AV {maxScore}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  glow: {
    shadowColor: colors.homeAccentSlate,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
    elevation: 4,
  },
  wrapper: {
    width: GAUGE_SIZE,
    height: GAUGE_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerText: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  score: {
    color: colors.onboardingText,
    fontSize: homeTypography.healthScoreValueSize,
    fontWeight: typography.fontWeight.light,
    lineHeight: 52,
    letterSpacing: -0.8,
  },
  maxLabel: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
});
