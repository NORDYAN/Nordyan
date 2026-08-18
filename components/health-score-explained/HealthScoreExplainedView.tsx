import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { HealthScoreExplainedCoachCard } from '@/components/health-score-explained/HealthScoreExplainedCoachCard';
import { HealthScoreExplainedFactorList } from '@/components/health-score-explained/HealthScoreExplainedFactorList';
import { HealthScoreExplainedHeader } from '@/components/health-score-explained/HealthScoreExplainedHeader';
import { HealthScoreExplainedSummaryCard } from '@/components/health-score-explained/HealthScoreExplainedSummaryCard';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { t } from '@/lib/i18n';
import type {
  HealthScoreExplainedFetchState,
  HealthScoreExplainedViewModel,
} from '@/lib/presentation/health-score-explained';
import {
  colors,
  healthScoreExplainedLayout,
  healthScoreExplainedTypography,
  typography,
} from '@/theme';

type HealthScoreExplainedViewProps = {
  state: HealthScoreExplainedFetchState;
  onBackPress: () => void;
};

function resolveModel(
  state: HealthScoreExplainedFetchState,
): HealthScoreExplainedViewModel | null {
  if (state.status === 'ready' || state.status === 'insufficient_history') {
    return state.model;
  }
  return null;
}

export function HealthScoreExplainedView({
  state,
  onBackPress,
}: HealthScoreExplainedViewProps) {
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
        <HealthScoreExplainedHeader onBackPress={onBackPress} />

        <View style={styles.content}>
          <HealthScoreExplainedSummaryCard
            scoreDisplay={
              state.status === 'loading'
                ? '…'
                : model?.currentScore == null
                  ? '—'
                  : String(model.currentScore)
            }
            score={model?.currentScore}
            bandLabel={model?.scoreBandLabel ?? null}
            scoreChange={model?.scoreChange ?? null}
          />

          {state.status === 'loading' ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandAccent} size="small" />
              <Text style={styles.messageText} maxFontSizeMultiplier={1.1}>
                {t('explained.loading')}
              </Text>
            </View>
          ) : null}

          {statusMessage ? (
            <Text style={styles.messageText} maxFontSizeMultiplier={1.1}>
              {statusMessage}
            </Text>
          ) : null}

          {model ? (
            <>
              <HealthScoreExplainedFactorList factors={model.factors} />
              <HealthScoreExplainedCoachCard coach={model.coach} />
            </>
          ) : null}
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
    paddingBottom: healthScoreExplainedLayout.scrollPaddingBottom,
  },
  content: {
    width: '100%',
    paddingHorizontal: healthScoreExplainedLayout.horizontalPadding,
    gap: healthScoreExplainedLayout.contentGap,
    paddingTop: 8,
  },
  loadingState: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.developmentSurface,
    borderWidth: 1,
    borderColor: colors.developmentBorder,
    borderRadius: healthScoreExplainedLayout.summaryCardRadius,
    padding: healthScoreExplainedLayout.summaryCardPadding,
  },
  messageText: {
    color: colors.developmentTextMuted,
    fontSize: healthScoreExplainedTypography.factorBodySize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: healthScoreExplainedTypography.factorBodySize * 1.4,
    includeFontPadding: false,
    textAlign: 'center',
  },
});
