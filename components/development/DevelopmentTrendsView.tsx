import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { DevelopmentFactorsCta } from '@/components/development/DevelopmentFactorsCta';
import { DevelopmentMetricSelector } from '@/components/development/DevelopmentMetricSelector';
import { DevelopmentPeriodSelector } from '@/components/development/DevelopmentPeriodSelector';
import { DevelopmentTrendChart } from '@/components/development/DevelopmentTrendChart';
import { DevelopmentTrendsHeader } from '@/components/development/DevelopmentTrendsHeader';
import { DevelopmentTrendsScoreCard } from '@/components/development/DevelopmentTrendsScoreCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import {
  DEVELOPMENT_FACTORS_CTA_ROUTE,
  type DevelopmentMetricOption,
  type DevelopmentPeriodOption,
  type DevelopmentTrendsFetchState,
  type DevelopmentTrendsViewModel,
} from '@/lib/presentation/development';
import { t } from '@/lib/i18n';
import type { DevelopmentPeriod, DevelopmentTrendMetric } from '@/lib/services/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentTrendsViewProps = {
  state: DevelopmentTrendsFetchState;
  period: DevelopmentPeriod;
  metric: DevelopmentTrendMetric;
  periodOptions: readonly DevelopmentPeriodOption[];
  metricOptions: readonly DevelopmentMetricOption[];
  onPeriodChange: (period: DevelopmentPeriod) => void;
  onMetricChange: (metric: DevelopmentTrendMetric) => void;
};

function resolveModel(
  state: DevelopmentTrendsFetchState,
): DevelopmentTrendsViewModel | null {
  if (state.status === 'ready' || state.status === 'insufficient_history') {
    return state.model;
  }
  return null;
}

export function DevelopmentTrendsView({
  state,
  period,
  metric,
  periodOptions,
  metricOptions,
  onPeriodChange,
  onMetricChange,
}: DevelopmentTrendsViewProps) {
  const model = resolveModel(state);
  const statusMessage =
    state.status === 'empty' || state.status === 'error' ? state.message : null;

  return (
    <ScreenContainer variant="development" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DevelopmentTrendsHeader onBackPress={() => router.back()} />

        <View style={styles.content}>
          <DevelopmentTrendsScoreCard
            scoreDisplay={
              state.status === 'loading'
                ? '…'
                : model?.currentScore == null
                  ? '—'
                  : String(model.currentScore)
            }
            bandLabel={model?.scoreBandLabel ?? null}
            periodChange={model?.periodChange ?? null}
          />

          {statusMessage ? (
            <Text style={styles.messageText} maxFontSizeMultiplier={1.1}>
              {statusMessage}
            </Text>
          ) : null}

          <DevelopmentPeriodSelector
            options={periodOptions}
            selected={period}
            onSelect={onPeriodChange}
          />

          {state.status === 'loading' ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandAccent} size="small" />
            </View>
          ) : (
            <DevelopmentTrendChart
              points={model?.chartPoints ?? []}
              valueDomain={model?.chartValueDomain ?? null}
              hasSufficientHistory={model?.hasSufficientHistory ?? false}
              emptyMessage={
                model?.chartEmptyMessage ??
                statusMessage ??
                t('development.chartInsufficient')
              }
            />
          )}

          <DevelopmentMetricSelector
            options={metricOptions}
            selected={metric}
            onSelect={onMetricChange}
          />

          <DevelopmentFactorsCta onPress={() => router.push(DEVELOPMENT_FACTORS_CTA_ROUTE)} />
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: developmentLayout.scrollPaddingBottom,
  },
  content: {
    width: '100%',
    paddingHorizontal: developmentLayout.horizontalPadding,
    gap: developmentLayout.trendsContentGap,
    paddingTop: developmentLayout.sectionPaddingVertical,
  },
  loadingState: {
    minHeight: developmentLayout.trendsChartHeight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: developmentLayout.trendsChartCardRadius,
  },
  messageText: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
});
