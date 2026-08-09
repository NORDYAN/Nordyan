import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import {
  HomeCoachCard,
  HomeHealthScoreCard,
  type HomeHealthScoreCardState,
  HomeMeasurementFollowUpCard,
  HomeMetricTile,
  HomePriorityItem,
  HomeProgressCard,
  HomeSectionHeading,
} from '@/components/home';
import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Text } from '@/components/ui/Text';
import { routes } from '@/constants/routes';
import { shouldShowBodyMeasurementFollowUp } from '@/lib/domain/profile';
import { useHomeCoachLanguage, useHomeCurrentHealth } from '@/lib/hooks/home';
import { useHomeProgress } from '@/lib/hooks/progress';
import { HOME_COACH_UNAVAILABLE_MESSAGE } from '@/lib/services/home';
import { colors, homeLayout, homeTypography, spacing, typography } from '@/theme';

const HOME_LOGO = require('../../assets/logos/nordyan-logo-transparent-final.png');
const HOME_LOGO_SIZE = 36;
const HOME_LOGO_WORDMARK_SIZE = 17;

const INITIAL_PRIORITIES: Array<{
  id: string;
  title: string;
  subtitle: string;
  completed: boolean;
}> = [
  {
    id: 'walk',
    title: '30 min promenad',
    subtitle: 'Lugnt tempo, fokus på andning',
    completed: false,
  },
  {
    id: 'sleep',
    title: 'Lägg dig före 22:30',
    subtitle: 'Skärmfri tid 30 min innan',
    completed: false,
  },
  {
    id: 'water',
    title: 'Drick 2L vatten',
    subtitle: '4 glas kvar att dricka',
    completed: false,
  },
];

export default function HomeScreen() {
  const [priorities, setPriorities] = useState(INITIAL_PRIORITIES);
  const { state: currentHealthState, snapshotRefreshKey, isProfileLoading, profile, latestSnapshot } =
    useHomeCurrentHealth();
  const progressState = useHomeProgress({
    profile,
    isProfileLoading,
    snapshotRefreshKey,
  });

  const showMeasurementFollowUp =
    !isProfileLoading && shouldShowBodyMeasurementFollowUp(profile, latestSnapshot);

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
      message: 'Din hälsopoäng kan inte beräknas ännu.',
    };
  }, [currentHealthState]);

  const templateCoachMessage =
    currentHealthState.status === 'ready'
      ? currentHealthState.data.coach.message
      : HOME_COACH_UNAVAILABLE_MESSAGE;

  const languageSource =
    currentHealthState.status === 'ready' ? currentHealthState.data.coach.languageSource : null;

  const { message: coachMessage } = useHomeCoachLanguage({
    templateMessage: templateCoachMessage,
    languageSource,
    enabled:
      currentHealthState.status === 'ready' &&
      currentHealthState.data.coach.availability === 'available',
  });

  const displayPriorities = useMemo(() => {
    if (currentHealthState.status !== 'ready') {
      return priorities;
    }

    return priorities.map((item, index) =>
      index === 0
        ? {
            ...item,
            title: currentHealthState.data.focus.title,
            subtitle: currentHealthState.data.focus.subtitle,
          }
        : item,
    );
  }, [currentHealthState, priorities]);

  const togglePriority = (id: string, completed: boolean) => {
    setPriorities((current) =>
      current.map((item) => (item.id === id ? { ...item, completed } : item)),
    );
  };

  const greetingTitle = profile?.firstName
    ? `Hej ${profile.firstName}`
    : 'Din hälsoplan för idag';

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
        ? 'Hämtar data…'
        : 'Ingen profilvikt ännu';

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
        ? 'Hämtar data…'
        : 'Ingen profildata ännu';

  return (
    <ScreenContainer variant="home">
      <ScrollView
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
            accessibilityLabel="Profil"
            onPress={() => router.push(routes.profile)}
          >
            <Ionicons name="person-outline" size={16} color={colors.homeTextMuted} />
          </Pressable>
        </View>

        <View style={styles.greetingBlock}>
          <Text style={styles.greetingTitle}>{greetingTitle}</Text>
          <Text style={styles.greetingSubtitle}>
            Personligt anpassad utifrån din hälsa, aktivitet och återhämtning.
          </Text>
        </View>

        <HomeHealthScoreCard state={healthScoreCardState} />

        {showMeasurementFollowUp ? (
          <HomeMeasurementFollowUpCard onPress={() => router.push(routes.healthNewMeasurement)} />
        ) : null}

        <HomeProgressCard state={progressState} />

        <HomeCoachCard message={coachMessage} />

        <View style={styles.section}>
          <HomeSectionHeading title="Dagens prioriteringar" />
          <View style={styles.priorityList}>
            {displayPriorities.map((item) => (
              <HomePriorityItem
                key={item.id}
                title={item.title}
                subtitle={item.subtitle}
                completed={item.completed}
                onToggleComplete={(completed) => togglePriority(item.id, completed)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <HomeSectionHeading title="Hälsoöversikt" />
          <View style={styles.metricGrid}>
            <View style={styles.metricRow}>
              <HomeMetricTile
                label="Vikt"
                value={weightValue}
                changeLabel={weightChangeLabel}
              />
              <HomeMetricTile
                label="Kroppsfett"
                value={bodyFatValue}
                changeLabel={bodyFatChangeLabel}
              />
            </View>
            <View style={styles.metricRow}>
              <HomeMetricTile
                label="Sömn"
                value="Ingen data"
                changeLabel="—"
              />
              <HomeMetricTile
                label="Steg"
                value="Ingen data"
                changeLabel="—"
              />
            </View>
          </View>
        </View>
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
  priorityList: {
    gap: homeLayout.listGap,
  },
  metricGrid: {
    gap: homeLayout.gridGap,
  },
  metricRow: {
    flexDirection: 'row',
    gap: homeLayout.gridGap,
  },
});
