import type { Result } from '@/lib/core';
import type { WeeklyCheckIn } from '@/lib/domain/weekly-check-in';

export type WeeklyCheckInCurrentWeek =
  | { status: 'empty'; weekStartDate: string }
  | { status: 'ready'; weekStartDate: string; checkIn: WeeklyCheckIn };

export interface WeeklyCheckInService {
  getCurrentWeek(
    userId: string,
    localDate?: string,
  ): Promise<Result<WeeklyCheckInCurrentWeek>>;
  saveCurrentWeek(
    userId: string,
    answers: unknown,
    localDate?: string,
  ): Promise<Result<WeeklyCheckIn>>;
}
