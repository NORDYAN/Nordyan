import { StyleSheet, View } from 'react-native';

import { Card } from '@/components/ui/Card';
import { Text } from '@/components/ui/Text';
import { HomeSectionHeading } from '@/components/home/HomeSectionHeading';
import { t } from '@/lib/i18n';
import { useI18n } from '@/lib/i18n/I18nProvider';
import {
  formatHomeWeekCompletedCount,
  toHomeWeeklyFocusAreas,
} from '@/lib/presentation/home/home-weekly-focus-copy';
import type { HomeWeeklyFocusStatus } from '@/lib/presentation/home';
import { colors, homeLayout, typography } from '@/theme';

type WeeklyFocusCardProps = {
  weeklyFocus: HomeWeeklyFocusStatus;
  weekCompletedCount: number | null;
};

export function WeeklyFocusCard({ weeklyFocus, weekCompletedCount }: WeeklyFocusCardProps) {
  useI18n();
  const areas = toHomeWeeklyFocusAreas(weeklyFocus);

  return (
    <View style={styles.section}>
      <HomeSectionHeading title={t('home.weeklyFocus.heading')} />
      <Card
        padding={homeLayout.metricCardPadding}
        borderRadius={homeLayout.metricCardRadius}
        style={styles.card}
      >
        {weeklyFocus.status === 'loading' ? <Text style={styles.loading}>…</Text> : null}

        {weeklyFocus.status === 'unavailable' ? (
          <Text style={styles.quiet}>{t('home.weeklyFocus.unavailable')}</Text>
        ) : null}

        {areas
          ? areas.map((item) => (
              <Text key={item.area} style={styles.area}>
                {item.name}
              </Text>
            ))
          : null}

        {weekCompletedCount != null ? (
          <Text style={styles.count}>{formatHomeWeekCompletedCount(weekCompletedCount)}</Text>
        ) : null}
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
  },
  card: {
    gap: 8,
  },
  loading: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.md,
  },
  quiet: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
  },
  area: {
    color: colors.onboardingText,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  count: {
    color: colors.homeTextMuted,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    marginTop: 4,
  },
});
