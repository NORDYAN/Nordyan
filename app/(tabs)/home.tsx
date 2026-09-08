import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  DailyFocusCard,
  HomeCoachCard,
  HomeHealthScoreCard,
  type HomeHealthScoreCardState,
  HomeMeasurementFollowUpCard,
  HomeMetricTile,
  HomeProgressCard,
  HomeSectionHeading,
  HomeWeeklyCheckInCard,
  WeeklyFocusCard,
} from '@/components/home';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { shouldShowBodyMeasurementFollowUp } from '@/lib/domain/profile';
import { useHomeCurrentHealth, useHomeDailyFocus, useHomeWeeklyCheckIn, useHomeWeeklyFocus } from '@/lib/hooks/home';
import { useHomeProgress } from '@/lib/hooks/progress';
import { toHomeDailyFocusView } from '@/lib/presentation/home/home-daily-focus.presentation';
import {
  consumeHomeScrollToTopIntent,
  shouldShowHomeWeeklyCheckInCard,
} from '@/lib/presentation/home';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { colors, homeLayout, homeTypography, spacing, typography } from '@/theme';

const HOME_LOGO = require('../../assets/logos/nordyan-logo-transparent-final.png');
const HOME_LOGO_SIZE = 36;
const HOME_LOGO_WORDMARK_SIZE = 17;

export default function HomeScreen() {
  useI18n();
  const scrollRef = useRef<ScrollView>(null);
  const { scrollToTop } = useLocalSearchParams<{ scrollToTop?: string | string[] }>();
  const { state: currentHealthState, snapshotRefreshKey, isProfileLoading, profile, latestSnapshot } =
    useHomeCurrentHealth();
  const progressState = useHomeProgress({
    profile,
    isProfileLoading,
    snapshotRefreshKey,
  });
  const { state: weeklyCheckInState } = useHomeWeeklyCheckIn();
  const { state: weeklyFocusState } = useHomeWeeklyFocus();
  const { model: dailyFocusModel, complete, undo, swap } = useHomeDailyFocus({
    weeklyFocus: weeklyFocusState,
  });
  const dailyFocusView = toHomeDailyFocusView(dailyFocusModel);

  const showMeasurementFollowUp =
    !isProfileLoading && shouldShowBodyMeasurementFollowUp(profile, latestSnapshot);
  const showWeeklyCheckIn = shouldShowHomeWeeklyCheckInCard(weeklyCheckInState);

  const healthScoreCardState = useMemo((): HomeHealthScoreCardState => {
    if (currentHealthState.status === 'loading') {
      return { status: 'loading' };
    }

    if (currentHealthState.status === 'ready') {
      return {
        status: 'ready',
        score: currentHealthState.data.healthScore.score,
        subtitle: currentHealthState.data.healthScore.subtitle,
      };
    }

    if (currentHealthState.status === 'error') {
      return { status: 'unavailable', message: currentHealthState.message };
    }

    return {
      status: 'unavailable',
      message: t('home.healthScore.unavailable'),
    };
  }, [currentHealthState]);

  useFocusEffect(
    useCallback(() => {
      if (!consumeHomeScrollToTopIntent()) {
        return;
      }

      scrollRef.current?.scrollTo({ y: 0, animated: false });
      if (scrollToTop != null) {
        router.setParams({ scrollToTop: undefined });
      }
    }, [scrollToTop]),
  );

  const greetingTitle = profile?.firstName
    ? t('home.greeting.named', { name: profile.firstName })
    : t('home.greeting.default');

  const weightValue =
    currentHealthState.status === 'loading'
      ? '…'
      : currentHealthState.status === 'ready'
        ? currentHealthState.data.metrics.weightDisplay
        : '—';

  const weightChangeLabel =
    currentHealthState.status === 'ready'
      ? currentHealthState.data.metrics.weightSourceLabel
      : currentHealthState.status === 'loading'
        ? t('home.fetching')
        : t('home.noProfileWeight');

  const bodyFatValue =
    currentHealthState.status === 'loading'
      ? '…'
      : currentHealthState.status === 'ready'
        ? currentHealthState.data.metrics.bodyFatDisplay
        : '—';

  const bodyFatChangeLabel =
    currentHealthState.status === 'ready'
      ? currentHealthState.data.metrics.bodyFatSourceLabel
      : currentHealthState.status === 'loading'
        ? t('home.fetching')
        : t('home.noProfileData');

  return (
    <ScreenContainer variant="home">
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topHeader}>
          <View style={styles.logoGroup}>
            <Image
              source={HOME_LOGO}
              style={styles.logoIcon}
              resizeMode="contain"
              accessibilityLabel="NORDYAN mountain mark"
            />
            <Text style={styles.logoText}>NORDYAN</Text>
          </View>

          <Pressable
            style={styles.profileTrigger}
            accessibilityRole="button"
            accessibilityLabel={t('profile.title')}
            onPress={() => router.push(routes.profile)}
          >
            <Ionicons name="person-outline" size={16} color={colors.homeTextMuted} />
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>{greetingTitle}</Text>
          <Text style={styles.greetingSubtitle}>{t('home.greeting.subtitle')}</Text>
        </View>

        <HomeHealthScoreCard state={healthScoreCardState} />

        <DailyFocusCard
          view={dailyFocusView}
          onComplete={() => {
            void complete();
          }}
          onUndo={() => {
            void undo();
          }}
          onSwap={() => {
            void swap();
          }}
        />

        <WeeklyFocusCard
          weeklyFocus={weeklyFocusState}
          weekCompletedCount={dailyFocusModel.weekCompletedCount}
        />

        {showWeeklyCheckIn ? (
          <HomeWeeklyCheckInCard onPress={() => router.push(routes.weeklyCheckIn)} />
        ) : null}

        {showMeasurementFollowUp ? (
          <HomeMeasurementFollowUpCard onPress={() => router.push(routes.healthNewMeasurement)} />
        ) : null}

        <View style={styles.section}>
          <HomeSectionHeading title={t('home.overview.heading')} />
          <View style={styles.metricGrid}>
            <View style={styles.metricRow}>
              <HomeMetricTile
                label={t('home.metric.weight')}
                value={weightValue}
                changeLabel={weightChangeLabel}
              />
              <HomeMetricTile
                label={t('home.metric.bodyFat')}
                value={bodyFatValue}
                changeLabel={bodyFatChangeLabel}
              />
            </View>
            <View style={styles.metricRow}>
              <HomeMetricTile
                label={t('home.metric.sleep')}
                value={t('home.metric.noData')}
                changeLabel="—"
              />
              <HomeMetricTile
                label={t('home.metric.steps')}
                value={t('home.metric.noData')}
                changeLabel="—"
              />
            </View>
          </View>
        </View>

        <HomeProgressCard state={progressState} />

        <HomeCoachCard onPressAsk={() => router.push(routes.coach)} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    gap: homeLayout.contentGap,
    paddingBottom: homeLayout.scrollBottomPadding,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 32,
  },
  logoGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoIcon: {
    width: HOME_LOGO_SIZE,
    height: HOME_LOGO_SIZE,
  },
  logoText: {
    color: colors.onboardingText,
    fontSize: HOME_LOGO_WORDMARK_SIZE,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  profileTrigger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.homeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingBlock: {
    gap: 4,
  },
  greetingTitle: {
    color: colors.onboardingText,
    fontSize: homeTypography.greetingTitleSize,
    fontWeight: typography.fontWeight.regular,
    lineHeight: homeTypography.greetingTitleSize * typography.lineHeight.tight,
  },
  greetingSubtitle: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.light,
    lineHeight: typography.fontSize.sm * typography.lineHeight.relaxed,
  },
  section: {
    width: '100%',
  },
  metricGrid: {
    gap: homeLayout.gridGap,
  },
  metricRow: {
    flexDirection: 'row',
    gap: homeLayout.gridGap,
  },
});
