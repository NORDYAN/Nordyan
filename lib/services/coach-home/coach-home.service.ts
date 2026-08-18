import type { Result } from '@/lib/core';
import { snapshotService } from '@/lib/services/snapshots';

import { buildCoachHomeSummary } from './coach-home.derivation';
import type { CoachHomeSummary } from './coach-home.types';

export interface CoachHomeService {
  getHomeSummary(userId: string): Promise<Result<CoachHomeSummary>>;
}

class DefaultCoachHomeService implements CoachHomeService {
  async getHomeSummary(userId: string): Promise<Result<CoachHomeSummary>> {
    const result = await snapshotService.getLatestSnapshot(userId);
    if (!result.ok) {
      return result;
    }

    return { ok: true, value: buildCoachHomeSummary(result.value) };
  }
}

export const coachHomeService: CoachHomeService = new DefaultCoachHomeService();
