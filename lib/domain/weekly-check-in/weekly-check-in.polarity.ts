import type { WeeklyCheckInPolarity, WeeklyCheckInScaleField } from './weekly-check-in.types';

/**
 * Explicit polarity so later trend/Coach logic cannot assume higher = better.
 * No combined score. No averaging.
 */
export const WEEKLY_CHECK_IN_SCALE_POLARITY = {
  sleepQuality: 'higher_better',
  energy: 'higher_better',
  stress: 'higher_worse',
  everydayActivity: 'higher_better',
  eatingQuality: 'higher_better',
  planAdherence: 'higher_better',
} as const satisfies Record<WeeklyCheckInScaleField, WeeklyCheckInPolarity>;

export function getWeeklyCheckInScalePolarity(
  field: WeeklyCheckInScaleField,
): WeeklyCheckInPolarity {
  return WEEKLY_CHECK_IN_SCALE_POLARITY[field];
}
