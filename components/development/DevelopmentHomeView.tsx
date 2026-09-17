import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { DevelopmentCoachCard } from '@/components/development/DevelopmentCoachCard';
import { DevelopmentDriverCard } from '@/components/development/DevelopmentDriverCard';
import { DevelopmentHomeHeader } from '@/components/development/DevelopmentHomeHeader';
import { DevelopmentScoreHero } from '@/components/development/DevelopmentScoreHero';
import { DevelopmentTrendsCta } from '@/components/development/DevelopmentTrendsCta';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE,
  getDevelopmentHomeInsufficientMessage,
  type DevelopmentHomeFetchState,
} from '@/lib/presentation/development';
import { colors, developmentLayout, developmentTypography, typography } from '@/theme';

type DevelopmentHomeViewProps = {
  state: DevelopmentHomeFetchState;
};

function handleTrendsPress() {
  router.push(routes.progressTrends);
}

function handleSaveMeasurementPress() {
  router.push(DEVELOPMENT_HOME_MEASUREMENT_CTA_ROUTE);
}

export function DevelopmentHomeView({ state }: DevelopmentHomeViewProps) {
  useI18n();
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
        <DevelopmentHomeHeader />

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
              {state.status === 'empty' ? (
                <Button
                  label={t('health.history.register')}
                  variant="onboarding"
                  style={styles.measurementCta}
                  onPress={handleSaveMeasurementPress}
                />
              ) : null}
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
            {state.status === 'insufficient_history' ? (
              <View style={styles.messageState}>
                <Text style={styles.messageText}>{getDevelopmentHomeInsufficientMessage()}</Text>
                <Button
                  label={t('health.history.register')}
                  variant="onboarding"
                  style={styles.measurementCta}
                  onPress={handleSaveMeasurementPress}
                />
              </View>
            ) : null}
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
    gap: developmentLayout.sectionPaddingVertical,
  },
  messageText: {
    color: colors.developmentTextMuted,
    fontSize: developmentTypography.subtitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: developmentTypography.subtitleSize * 1.35,
    includeFontPadding: false,
  },
  measurementCta: {
    width: '100%',
  },
});
