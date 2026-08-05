import type { Result } from '@/lib/core';
import type { UserProfile } from '@/lib/domain/profile';
import type { HealthSnapshot, SnapshotReason } from '@/lib/domain/snapshot';
import { calculateHomeHealthScoreFromProfile } from '@/lib/services/health-score';

import {
  buildCreateSnapshotInputFromPipeline,
  runFocusAndCoachPipeline,
} from './health-snapshot-pipeline';
import { snapshotService } from './snapshot.service';

export type ProfileSnapshotReason = Exclude<SnapshotReason, 'weekly_checkin' | 'measurement'>;

export async function createHealthSnapshotFromProfile(
  profile: UserProfile,
  snapshotReason: ProfileSnapshotReason,
): Promise<Result<HealthSnapshot>> {
  const calculated = calculateHomeHealthScoreFromProfile(profile);
  if (!calculated) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Profilen saknar uppgifter som krävs för att beräkna hälsosnapshot.',
      },
    };
  }

  const pipelineResult = runFocusAndCoachPipeline(
    calculated.input,
    calculated.result,
    profile.goal,
  );
  if (!pipelineResult.ok) {
    return pipelineResult;
  }

  const fullPipeline = {
    healthScoreInput: calculated.input,
    healthScoreResult: calculated.result,
    ...pipelineResult.value,
  };

  const inputResult = buildCreateSnapshotInputFromPipeline(
    profile.userId,
    {
      weightKg: calculated.input.weightKg,
      waistCm: calculated.input.waistCm,
      neckCm: calculated.input.neckCm,
    },
    fullPipeline,
    snapshotReason,
  );
  if (!inputResult.ok) {
    return inputResult;
  }

  return snapshotService.createSnapshot(inputResult.value);
}
