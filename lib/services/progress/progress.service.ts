import type { Result } from '@/lib/core';
import type { HealthSnapshot } from '@/lib/domain/snapshot';
import type { ProgressSummary, ProgressTrend } from '@/lib/domain/progress';
import { snapshotService } from '@/lib/services/snapshots';

import type { ProgressService } from './progress.service.types';

const SNAPSHOTS_REQUIRED_FOR_PROGRESS = 2;

const LATEST_VS_PREVIOUS_COMPARISON = {
  type: 'latest_vs_previous',
  snapshotsCompared: 2,
} as const;

function deriveTrend(scoreChange: number): Exclude<ProgressTrend, 'insufficient_history'> {
  if (scoreChange > 0) {
    return 'improving';
  }

  if (scoreChange < 0) {
    return 'declining';
  }

  return 'stable';
}

function buildProgressSummary(
  current: HealthSnapshot,
  previous: HealthSnapshot,
): ProgressSummary {
  const scoreChange = current.overallScore - previous.overallScore;

  return {
    trend: deriveTrend(scoreChange),
    comparison: LATEST_VS_PREVIOUS_COMPARISON,
    currentScore: current.overallScore,
    previousScore: previous.overallScore,
    scoreChange,
    weightChange: current.weightKg - previous.weightKg,
    waistChange: current.waistCm - previous.waistCm,
    neckChange: current.neckCm - previous.neckCm,
  };
}

class DefaultProgressService implements ProgressService {
  async getProgressSummary(userId: string): Promise<Result<ProgressSummary>> {
    if (!userId.trim()) {
      return { ok: false, error: { code: 'VALIDATION', message: 'userId krävs.' } };
    }

    const historyResult = await snapshotService.getSnapshotHistory(
      userId,
      SNAPSHOTS_REQUIRED_FOR_PROGRESS,
    );

    if (!historyResult.ok) {
      return historyResult;
    }

    const [current, previous] = historyResult.value;

    if (!current || !previous) {
      return { ok: true, value: { trend: 'insufficient_history' } };
    }

    return { ok: true, value: buildProgressSummary(current, previous) };
  }
}

export const progressService = new DefaultProgressService();
