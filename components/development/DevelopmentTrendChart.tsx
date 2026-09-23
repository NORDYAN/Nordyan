import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';

import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import type { DevelopmentChartPointView } from '@/lib/presentation/development';
import {
  buildDevelopmentTrendChartCoords,
  type DevelopmentTrendChartValueDomain,
} from '@/lib/presentation/development/development-trend-chart.layout';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentTrendChartProps = {
  points: DevelopmentChartPointView[];
  hasSufficientHistory: boolean;
  emptyMessage: string | null;
  valueDomain?: DevelopmentTrendChartValueDomain | null;
};

export function DevelopmentTrendChart({
  points,
  hasSufficientHistory,
  emptyMessage,
  valueDomain = null,
}: DevelopmentTrendChartProps) {
  const [width, setWidth] = useState(0);
  const height = developmentLayout.trendsChartHeight;

  const coords = useMemo(() => {
    const layout = buildDevelopmentTrendChartCoords(
      points.map((point) => point.value),
      width,
      height,
      valueDomain,
    );
    return layout.map((coord) => ({
      ...coord,
      point: points[coord.index]!,
    }));
  }, [height, points, valueDomain, width]);

  const polylinePoints = coords.map((coord) => `${coord.x},${coord.y}`).join(' ');
  const last = coords[coords.length - 1];
  const startLabel = points[0]?.dateLabel ?? '';
  const endLabel = points[points.length - 1]?.dateLabel ?? '';

  return (
    <View style={styles.card}>
      <View
        style={styles.viewport}
        onLayout={(event) => {
          const nextWidth = event.nativeEvent.layout.width;
          if (nextWidth > 0 && nextWidth !== width) {
            setWidth(nextWidth);
          }
        }}
      >
        {!hasSufficientHistory || points.length < 2 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText} maxFontSizeMultiplier={1.1}>
              {emptyMessage ?? t('development.chartInsufficient')}
            </Text>
          </View>
        ) : width > 0 ? (
          <>
            <Svg width={width} height={height}>
              <Line
                x1={0}
                y1={height - 1}
                x2={width}
                y2={height - 1}
                stroke={colors.developmentBorder}
                strokeWidth={1}
              />
              <Polyline
                points={polylinePoints}
                fill="none"
                stroke={colors.brandAccent}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {last ? (
                <>
                  <Circle
                    cx={last.x}
                    cy={last.y}
                    r={6}
                    fill="rgba(94, 234, 212, 0.25)"
                  />
                  <Circle
                    cx={last.x}
                    cy={last.y}
                    r={3.5}
                    fill={colors.brandAccent}
                  />
                </>
              ) : null}
            </Svg>
            {last ? (
              <View
                pointerEvents="none"
                style={[
                  styles.valueBubble,
                  {
                    left: Math.min(Math.max(last.x - 14, 0), Math.max(width - 36, 0)),
                    top: Math.max(last.y - 22, 0),
                  },
                ]}
              >
                <Text style={styles.valueBubbleText} maxFontSizeMultiplier={1}>
                  {last.point.valueLabel}
                </Text>
              </View>
            ) : null}
          </>
        ) : null}
      </View>

      {hasSufficientHistory && points.length >= 2 ? (
        <View style={styles.axisRow}>
          <Text style={styles.axisLabel} maxFontSizeMultiplier={1.1}>
            {startLabel}
          </Text>
          <Text style={styles.axisLabel} maxFontSizeMultiplier={1.1}>
            {endLabel}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsChartCardRadius,
    padding: developmentLayout.trendsChartCardPadding,
    gap: developmentLayout.trendsChartGap,
  },
  viewport: {
    width: '100%',
    height: developmentLayout.trendsChartHeight,
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  emptyText: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.trendsChartEmptySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.trendsChartEmptySize * 1.4,
    textAlign: 'center',
    includeFontPadding: false,
  },
  valueBubble: {
    position: 'absolute',
    backgroundColor: colors.developmentBackground,
    borderWidth: 1,
    borderColor: colors.brandAccent,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  valueBubbleText: {
    color: colors.developmentText,
    fontSize: developmentTypography.trendsChartBubbleSize,
    fontWeight: typography.fontWeight.bold,
    includeFontPadding: false,
  },
  axisRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisLabel: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.trendsChartAxisSize,
    fontWeight: typography.fontWeight.regular,
    includeFontPadding: false,
  },
});
