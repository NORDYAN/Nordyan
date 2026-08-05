import type { Result } from '@/lib/core';
import type { CreateSnapshotInput, HealthSnapshot } from '@/lib/domain/snapshot';

export const DEFAULT_SNAPSHOT_HISTORY_LIMIT = 50;

export interface SnapshotService {
  createSnapshot(input: CreateSnapshotInput): Promise<Result<HealthSnapshot>>;
  getLatestSnapshot(userId: string): Promise<Result<HealthSnapshot | null>>;
  getSnapshotHistory(userId: string, limit?: number): Promise<Result<HealthSnapshot[]>>;
}
