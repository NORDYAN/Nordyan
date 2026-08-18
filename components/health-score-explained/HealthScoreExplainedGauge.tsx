import Svg, { Circle } from 'react-native-svg';
import { StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/Text';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

const STROKE_WIDTH = 6;

type HealthScoreExplainedGaugeProps = {
  score?: number;
  scoreDisplay?: string;
  maxScore?: number;
};

export function HealthScoreExplainedGauge({
  score = 0,
  scoreDisplay,
  maxScore = 100,
}: HealthScoreExplainedGaugeProps) {
  const size = healthScoreExplainedLayout.gaugeSize;
  const radius = (size - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const arcRatio = 0.72;
  const arcLength = circumference * arcRatio;
  const progress =
    scoreDisplay !== undefined ? 0 : Math.min(Math.max(score / maxScore, 0), 1);
  const progressLength = arcLength * progress;
  const centerLabel = scoreDisplay ?? String(score);

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.developmentBorder}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
          rotation={128}
          origin={`${size / 2}, ${size / 2}`}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.brandAccent}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeDasharray={`${progressLength} ${circumference}`}
          strokeLinecap="round"
          rotation={128}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.centerText}>
        <Text style={styles.score} maxFontSizeMultiplier={1}>
          {centerLabel}
        </Text>
        <Text style={styles.maxLabel} maxFontSizeMultiplier={1.1}>
          AV {maxScore}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
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
    color: colors.developmentText,
    fontSize: healthScoreExplainedTypography.scoreSize,
    fontWeight: typography.fontWeight.extrabold,
    lineHeight: healthScoreExplainedTypography.scoreSize * 0.95,
    includeFontPadding: false,
  },
  maxLabel: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.scoreMaxSize,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    includeFontPadding: false,
  },
});
