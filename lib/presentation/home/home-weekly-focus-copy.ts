import { t } from '@/lib/i18n';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';

import type { HomeWeeklyFocusStatus } from './home-weekly-focus.presentation';

const WEEKLY_FOCUS_AREA_KEYS = {
  sleep: 'home.weeklyFocus.area.sleep',
  nutrition: 'home.weeklyFocus.area.nutrition',
  everyday_movement: 'home.weeklyFocus.area.everyday_movement',
  training: 'home.weeklyFocus.area.training',
  recovery: 'home.weeklyFocus.area.recovery',
  alcohol: 'home.weeklyFocus.area.alcohol',
} as const satisfies Record<WeeklyFocusArea, `home.weeklyFocus.area.${WeeklyFocusArea}`>;

export function weeklyFocusAreaDisplayName(area: WeeklyFocusArea): string {
  return t(WEEKLY_FOCUS_AREA_KEYS[area]);
}

export function formatHomeWeekCompletedCount(count: number): string {
  if (count === 1) {
    return t('home.weeklyFocus.weekCompletedCount.one', { count });
  }

  return t('home.weeklyFocus.weekCompletedCount.other', { count });
}

export function toHomeWeeklyFocusAreas(
  status: HomeWeeklyFocusStatus,
): { area: WeeklyFocusArea; name: string }[] | null {
  if (status.status !== 'ready') {
    return null;
  }

  return status.data.focuses.map((focus) => ({
    area: focus.area,
    name: weeklyFocusAreaDisplayName(focus.area),
  }));
}
