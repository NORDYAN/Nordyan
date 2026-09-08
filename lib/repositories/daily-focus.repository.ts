import type { Result } from '@/lib/core';
import type {
  DailyFocusIntensity,
  DailyFocusMode,
} from '@/lib/domain/daily-focus';
import type { WeeklyFocusArea } from '@/lib/domain/weekly-focus';

export type PersistedDailyFocus = {
  id: string;
  userId: string;
  localDate: string;
  weekStartDate: string;
  actionId: string;
  focusArea: WeeklyFocusArea;
  weeklyMode: DailyFocusMode;
  intensity: DailyFocusIntensity;
  behaviorFamily: string;
  completedAt: string | null;
  swapCount: 0 | 1;
  swappedFromActionId: string | null;
  swappedFromBehaviorFamily: string | null;
  swappedFromFocusArea: WeeklyFocusArea | null;
  swappedFromIntensity: DailyFocusIntensity | null;
  actionBankVersion: string;
  selectorVersion: string;
  createdAt: string;
  updatedAt: string;
};

export type InsertDailyFocusInput = {
  userId: string;
  localDate: string;
  weekStartDate: string;
  actionId: string;
  focusArea: WeeklyFocusArea;
  weeklyMode: DailyFocusMode;
  intensity: DailyFocusIntensity;
  behaviorFamily: string;
  actionBankVersion: string;
  selectorVersion: string;
};

export type DailyFocusSwapReplacement = {
  actionId: string;
  focusArea: WeeklyFocusArea;
  weeklyMode: DailyFocusMode;
  intensity: DailyFocusIntensity;
  behaviorFamily: string;
};

export type DailyFocusSwapOriginalSnapshot = {
  actionId: string;
  focusArea: WeeklyFocusArea;
  weeklyMode: DailyFocusMode;
  intensity: DailyFocusIntensity;
  behaviorFamily: string;
};

export type SwapDailyFocusInput = {
  userId: string;
  localDate: string;
  expectedCurrentActionId: string;
  replacement: DailyFocusSwapReplacement;
  originalSnapshot: DailyFocusSwapOriginalSnapshot;
};

export interface DailyFocusRepository {
  getByUserAndDate(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>>;
  getHistoryRange(
    userId: string,
    fromLocalDateInclusive: string,
    toLocalDateExclusive: string,
  ): Promise<Result<PersistedDailyFocus[]>>;
  insert(input: InsertDailyFocusInput): Promise<Result<PersistedDailyFocus>>;
  swapIfAvailable(input: SwapDailyFocusInput): Promise<Result<PersistedDailyFocus | null>>;
  markComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>>;
  undoComplete(userId: string, localDate: string): Promise<Result<PersistedDailyFocus | null>>;
  countCompletedByWeek(userId: string, weekStartDate: string): Promise<Result<number>>;
}
