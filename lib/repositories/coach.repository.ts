import type { Result } from '@/lib/core';
import type { CoachRecommendation, CoachSession } from '@/lib/domain/coach';

export interface CoachRepository {
  getLatestRecommendation(userId: string): Promise<Result<CoachRecommendation | null>>;
  saveSession(session: CoachSession): Promise<Result<CoachSession>>;
}
