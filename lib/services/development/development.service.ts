import type { Result } from '@/lib/core';
import { measurementService } from '@/lib/services/measurement/measurement.service';
import { DEFAULT_SNAPSHOT_HISTORY_LIMIT, snapshotService } from '@/lib/services/snapshots';

import {
  buildDevelopmentHomeSummary,
  buildDevelopmentTrendsSummary,
  resolveDevelopmentPeriodSince,
} from './development.derivation';
import type {
  DevelopmentHomeSummary,
  DevelopmentPeriod,
  DevelopmentTrendsSummary,
} from './development.types';

const MEASUREMENTS_FOR_DRIVER_PAIR = 2;

export interface DevelopmentService {
  getHomeSummary(userId: string): Promise<Result<DevelopmentHomeSummary>>;
  getTrendsSummary(
    userId: string,
    period: DevelopmentPeriod,
    now?: Date,
  ): Promise<Result<DevelopmentTrendsSummary>>;
}

class DefaultDevelopmentService implements DevelopmentService {
  async getHomeSummary(userId: string): Promise<Result<DevelopmentHomeSummary>> {
    if (!userId.trim()) {
      return { ok: false, error: { code: 'VALIDATION', message: 'userId krävs.' } };
    }

    const [historyResult, measurementResult] = await Promise.all([
      snapshotService.getSnapshotHistory(userId, DEFAULT_SNAPSHOT_HISTORY_LIMIT),
      measurementService.getMeasurementHistory(userId, MEASUREMENTS_FOR_DRIVER_PAIR),
    ]);

    if (!historyResult.ok) {
      return historyResult;
    }

    if (!measurementResult.ok) {
      return measurementResult;
    }

    const latest = historyResult.value[0] ?? null;
    const previous = historyResult.value[1] ?? null;

    return {
      ok: true,
      value: buildDevelopmentHomeSummary({
        latest,
        previous,
        measurementsNewestFirst: measurementResult.value,
        activitySnapshotsNewestFirst: historyResult.value,
      }),
    };
  }

  async getTrendsSummary(
    userId: string,
    period: DevelopmentPeriod,
    now: Date = new Date(),
  ): Promise<Result<DevelopmentTrendsSummary>> {
    if (!userId.trim()) {
      return { ok: false, error: { code: 'VALIDATION', message: 'userId krävs.' } };
    }

    const periodSince = resolveDevelopmentPeriodSince(period, now);

    const [rangeResult, latestResult] = await Promise.all([
      snapshotService.getSnapshotHistoryInRange(userId, { since: periodSince }),
      snapshotService.getLatestSnapshot(userId),
    ]);

    if (!rangeResult.ok) {
      return rangeResult;
    }

    if (!latestResult.ok) {
      return latestResult;
    }

    return {
      ok: true,
      value: buildDevelopmentTrendsSummary({
        period,
        periodSince,
        periodSnapshotsAscending: rangeResult.value,
        absoluteLatest: latestResult.value,
      }),
    };
  }
}

export const developmentService: DevelopmentService = new DefaultDevelopmentService();
