import type { Result } from '@/lib/core';
import type { WeeklyFocusAssignment, WeeklyFocusSelectedArea } from '@/lib/domain/weekly-focus';

export type InsertWeeklyFocusAssignmentInput = {
  userId: string;
  weekStartDate: string;
  focuses: [WeeklyFocusSelectedArea, WeeklyFocusSelectedArea];
  recoveryConstraint: boolean;
  engineVersion: string;
  insufficientEvidenceFallback: boolean;
};

export interface WeeklyFocusRepository {
  getByUserAndWeek(
    userId: string,
    weekStartDate: string,
  ): Promise<Result<WeeklyFocusAssignment | null>>;
  insert(input: InsertWeeklyFocusAssignmentInput): Promise<Result<WeeklyFocusAssignment>>;
}
