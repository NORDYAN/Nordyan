import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { DevelopmentCoachCard } from '@/components/development/DevelopmentCoachCard';
import { DevelopmentDriverCard } from '@/components/development/DevelopmentDriverCard';
import { DevelopmentHomeHeader } from '@/components/development/DevelopmentHomeHeader';
import { DevelopmentScoreHero } from '@/components/development/DevelopmentScoreHero';
import { DevelopmentTrendsCta } from '@/components/development/DevelopmentTrendsCta';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import type { DevelopmentHomeFetchState } from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentHomeViewProps = {
  state: DevelopmentHomeFetchState;
};

function handleBackPress() {
  if (router.canGoBack()) {
    router.back();
    return;
  }

  router.replace(routes.home);
}

function handleTrendsPress() {
  router.push(routes.progressTrends);
}

export function DevelopmentHomeView({ state }: DevelopmentHomeViewProps) {
  const model =
    state.status === 'ready' || state.status === 'insufficient_history' ? state.model : null;

  return (
    <ScreenContainer variant="development" style={styles.screen}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <DevelopmentHomeHeader onBackPress={handleBackPress} />

        {state.status === 'loading' ? (
          <>
            <DevelopmentScoreHero scoreDisplay="…" bandLabel="" scoreChange={null} />
            <View style={styles.loadingState}>
              <ActivityIndicator color={colors.brandAccent} size="small" />
            </View>
          </>
        ) : null}

        {state.status === 'empty' || state.status === 'error' ? (
          <>
            <DevelopmentScoreHero scoreDisplay="—" bandLabel="" scoreChange={null} />
            <View style={styles.messageState}>
              <Text style={styles.messageText}>{state.message}</Text>
            </View>
            <DevelopmentCoachCard coach={null} />
            <DevelopmentTrendsCta onPress={handleTrendsPress} />
          </>
        ) : null}

        {model ? (
          <>
            <DevelopmentScoreHero
              scoreDisplay={String(model.currentScore)}
              bandLabel={model.scoreBandLabel}
              scoreChange={model.scoreChange}
            />
            <DevelopmentDriverCard drivers={model.drivers} />
            <DevelopmentCoachCard coach={model.coach} />
            <DevelopmentTrendsCta onPress={handleTrendsPress} />
          </>
        ) : null}
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
  loadingState: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  messageState: {
    paddingHorizontal: developmentLayout.horizontalPadding,
    paddingBottom: developmentLayout.sectionPaddingVertical,
  },
  messageText: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
});
