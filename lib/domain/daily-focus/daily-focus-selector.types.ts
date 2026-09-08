import type { WeeklyFocusArea, WeeklyFocusNeedScore } from '../weekly-focus';

import type { DailyFocusIntensity, DailyFocusMode } from './daily-focus.types';

export const DAILY_FOCUS_COOLDOWN_DAYS = 14;

/** Today D blocks actions shown on D-1 through D-14 inclusive. D-15 is eligible. */
export const DAILY_FOCUS_COOLDOWN_INCLUSIVE_LOOKBACK = true;

export type DailyFocusSelectionReason = 'initial' | 'swap';

export type DailyFocusRelaxationLevel = 0 | 1 | 2 | 3;

export type DailyFocusHistoryEntry = {
  localDate: string;
  actionId: string;
  behaviorFamily: string;
  focusArea: WeeklyFocusArea;
  intensity: DailyFocusIntensity;
  swappedFromActionId?: string;
  swappedFromBehaviorFamily?: string;
  swappedFromFocusArea?: WeeklyFocusArea;
  swappedFromIntensity?: DailyFocusIntensity;
  /** Persistence may store this; selector v1 ignores it. */
  completed?: boolean;
};

export type DailyFocusSelectorFocus = {
  area: WeeklyFocusArea;
  mode: DailyFocusMode;
  needScore: WeeklyFocusNeedScore;
};

export type DailyFocusSelectorWeeklyFocus = {
  weekStartDate: string;
  focuses: readonly [DailyFocusSelectorFocus, DailyFocusSelectorFocus];
  recoveryConstraint: boolean;
  engineVersion: string;
};

export type DailyFocusSelectorContext = {
  lessHealthyFoodRelevant?: boolean;
};

export type DailyFocusSelectorInput = {
  weeklyFocus: DailyFocusSelectorWeeklyFocus;
  localDate: string;
  history: readonly DailyFocusHistoryEntry[];
  /** Opaque caller-supplied seed. Do not pass PII. */
  selectionSeed: string;
  selectionReason?: DailyFocusSelectionReason;
  context?: DailyFocusSelectorContext;
};

export type DailyFocusSelectionMetadata = {
  relaxationLevel: DailyFocusRelaxationLevel;
  usedCooldownRelaxation: boolean;
  usedFamilyRelaxation: boolean;
  usedAreaAlternationPreference: boolean;
  candidateCount: number;
};

export type DailyFocusSelectorResult = {
  actionId: string;
  focusArea: WeeklyFocusArea;
  behaviorFamily: string;
  intensity: DailyFocusIntensity;
  weeklyFocusMode: DailyFocusMode;
  selectionMetadata: DailyFocusSelectionMetadata;
};
