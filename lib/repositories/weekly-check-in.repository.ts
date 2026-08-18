import type { Result } from '@/lib/core';
import type { WeeklyCheckIn, WeeklyCheckInAnswers } from '@/lib/domain/weekly-check-in';

export type UpsertWeeklyCheckInInput = {
  userId: string;
  weekStartDate: string;
  answers: WeeklyCheckInAnswers;
};

export interface WeeklyCheckInRepository {
  getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyCheckIn | null>>;
  upsertCurrentWeek(input: UpsertWeeklyCheckInInput): Promise<Result<WeeklyCheckIn>>;
}
