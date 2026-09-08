import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';

export const DAILY_FOCUS_INTENSITIES = ['micro', 'normal', 'challenge', 'recovery'] as const;
export type DailyFocusIntensity = (typeof DAILY_FOCUS_INTENSITIES)[number];

export const DAILY_FOCUS_MODES = ['improve', 'maintain'] as const;
export type DailyFocusMode = (typeof DAILY_FOCUS_MODES)[number];

export type DailyFocusEligibility = {
  weekdayOk: boolean;
  weekendOk: boolean;
  /** Later selector: only if less-healthy food frequency is actually relevant. */
  requiresLessHealthyFoodRelevance?: true;
};

export type DailyFocusActionDefinition = {
  id: string;
  focusArea: WeeklyFocusArea;
  behaviorFamily: string;
  intensity: DailyFocusIntensity;
  allowedModes: readonly DailyFocusMode[];
  titleKey: string;
  bodyKey: string;
  eligibility: DailyFocusEligibility;
};

export type DailyFocusActionDraft = Omit<DailyFocusActionDefinition, 'titleKey' | 'bodyKey'>;

export const DAILY_FOCUS_ANY_DAY: DailyFocusEligibility = {
  weekdayOk: true,
  weekendOk: true,
};
