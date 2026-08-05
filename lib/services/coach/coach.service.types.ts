import type { Result } from '@/lib/core';
import type { CoachRecommendation } from '@/lib/domain/coach';
import type {
  CoachEngineResult,
  CoachRecommendationCategory,
  CoachSafetyFlag,
} from '@/lib/domain/coach-engine';

export interface CoachService {
  getDailyRecommendation(): Promise<Result<CoachRecommendation | null>>;
  refreshRecommendation(): Promise<Result<CoachRecommendation>>;
}

export type HomeCoachState =
  | { status: 'loading' }
  | {
      status: 'ready';
      message: string;
      title: string;
      description: string;
      recommendationId: string;
      category: CoachRecommendationCategory;
      durationMinutes: number;
      frequencyPerWeek: number;
      expectedScoreGain: number;
      confidence: number;
      safetyFlags: CoachSafetyFlag[];
      result: CoachEngineResult;
    }
  | { status: 'unavailable' };
