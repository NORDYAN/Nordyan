import type { Result } from '@/lib/core';
import type { CreateSnapshotInput, HealthSnapshot } from '@/lib/domain/snapshot';

export const DEFAULT_SNAPSHOT_HISTORY_LIMIT = 50;

/** Upper bound for period-scoped history reads (1y of frequent captures). */
export const DEFAULT_SNAPSHOT_RANGE_LIMIT = 500;

export type SnapshotHistoryRangeOptions = {
  /** Inclusive lower bound (ISO timestamptz). */
  since: string;
  /** Inclusive upper bound (ISO timestamptz). Defaults to open-ended (now). */
  until?: string;
  limit?: number;
};

export interface SnapshotService {
  createSnapshot(input: CreateSnapshotInput): Promise<Result<HealthSnapshot>>;
  getLatestSnapshot(userId: string): Promise<Result<HealthSnapshot | null>>;
  getSnapshotHistory(userId: string, limit?: number): Promise<Result<HealthSnapshot[]>>;
  /**
   * Read-only history filtered by created_at at the query level.
   * Returns chronological ascending order for trend series.
   */
  getSnapshotHistoryInRange(
    userId: string,
    options: SnapshotHistoryRangeOptions,
  ): Promise<Result<HealthSnapshot[]>>;
}
