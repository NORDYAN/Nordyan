import type { Result } from '@/lib/core';
import {
  developmentService,
  type DevelopmentHomeSummary,
} from '@/lib/services/development';

/**
 * Thin read-only composer for Health Score Explained.
 * Reuses Development Home latest-vs-previous composition — no duplicated delta math.
 */
export interface HealthScoreExplainedService {
  getExplainedSummary(userId: string): Promise<Result<DevelopmentHomeSummary>>;
}

class DefaultHealthScoreExplainedService implements HealthScoreExplainedService {
  async getExplainedSummary(userId: string): Promise<Result<DevelopmentHomeSummary>> {
    return developmentService.getHomeSummary(userId);
  }
}

export const healthScoreExplainedService: HealthScoreExplainedService =
  new DefaultHealthScoreExplainedService();
