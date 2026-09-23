import type { Result } from '@/lib/core';
import { calculateHealthScore } from '@/lib/domain/health-score';
import type { Measurement } from '@/lib/domain/measurement';
import type { UserProfile } from '@/lib/domain/profile';
import type { CreateSnapshotInput, HealthSnapshot, SnapshotReason } from '@/lib/domain/snapshot';
import { getHealthScoreBandDisplayLabel } from '@/lib/i18n/localized-presentation';
import {
  getLocalCalendarDate,
  type HealthScoreProfileOptions,
} from '@/lib/services/health-score/health-score.mapper';
import { calculateHomeHealthScoreFromProfile } from '@/lib/services/health-score/health-score.service';
import { mapProfileUpdateToHealthScoreInput } from '@/lib/services/health-score/profile-measurement.mapper';

import {
  buildCreateSnapshotInputFromPipeline,
  runFocusAndCoachPipeline,
} from './health-snapshot-pipeline';

export type ProfileSnapshotReason = Exclude<SnapshotReason, 'weekly_checkin' | 'measurement'>;

export type CreateHealthSnapshotFromProfileDeps = {
  getLatestMeasurement: (userId: string) => Promise<Result<Measurement | null>>;
  persistMeasurementCircumferencesOnProfile?: (
    userId: string,
    waistCm: number,
    neckCm: number,
  ) => Promise<Result<UserProfile>>;
  createSnapshot: (input: CreateSnapshotInput) => Promise<Result<HealthSnapshot>>;
};

async function defaultGetLatestMeasurement(userId: string): Promise<Result<Measurement | null>> {
  const { measurementService } = await import('@/lib/services/measurement/measurement.service');
  const history = await measurementService.getMeasurementHistory(userId, 1);
  if (!history.ok) {
    return history;
  }

  return { ok: true, value: history.value[0] ?? null };
}

async function defaultPersistMeasurementCircumferencesOnProfile(
  userId: string,
  waistCm: number,
  neckCm: number,
): Promise<Result<UserProfile>> {
  const { supabaseProfileRepository } = await import(
    '@/lib/repositories/supabase-profile.repository'
  );
  return supabaseProfileRepository.update(userId, { waistCm, neckCm });
}

async function defaultCreateSnapshot(input: CreateSnapshotInput): Promise<Result<HealthSnapshot>> {
  const { snapshotService } = await import('./snapshot.service');
  return snapshotService.createSnapshot(input);
}

export const defaultCreateHealthSnapshotFromProfileDeps: CreateHealthSnapshotFromProfileDeps = {
  getLatestMeasurement: defaultGetLatestMeasurement,
  persistMeasurementCircumferencesOnProfile: defaultPersistMeasurementCircumferencesOnProfile,
  createSnapshot: defaultCreateSnapshot,
};

function missingHealthSnapshotInputError(): Result<HealthSnapshot> {
  return {
    ok: false,
    error: {
      code: 'VALIDATION',
      message: 'Profilen saknar uppgifter som krävs för att beräkna hälsosnapshot.',
    },
  };
}

export async function createHealthSnapshotFromProfile(
  profile: UserProfile,
  snapshotReason: ProfileSnapshotReason,
  options?: HealthScoreProfileOptions,
  deps: CreateHealthSnapshotFromProfileDeps = defaultCreateHealthSnapshotFromProfileDeps,
): Promise<Result<HealthSnapshot>> {
  const asOfDate = getLocalCalendarDate();
  let reusedMeasurement: Measurement | null = null;
  let calculated = null;

  if (snapshotReason === 'profile_update') {
    const latestResult = await deps.getLatestMeasurement(profile.userId);
    if (!latestResult.ok) {
      return latestResult;
    }

    reusedMeasurement = latestResult.value;
    const input = mapProfileUpdateToHealthScoreInput(profile, reusedMeasurement, asOfDate);
    if (!input) {
      return missingHealthSnapshotInputError();
    }

    const engineResult = calculateHealthScore(input);
    if (!engineResult.ok) {
      return missingHealthSnapshotInputError();
    }

    calculated = {
      score: engineResult.value.score,
      subtitle: getHealthScoreBandDisplayLabel(engineResult.value.score),
      input,
      result: engineResult.value,
    };
  } else {
    calculated = calculateHomeHealthScoreFromProfile(profile, asOfDate, options);
  }

  if (!calculated) {
    return missingHealthSnapshotInputError();
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

  const hipCm =
    calculated.input.hipCm ??
    (reusedMeasurement ? reusedMeasurement.hipCm : options?.hipCm) ??
    null;

  const inputResult = buildCreateSnapshotInputFromPipeline(
    profile.userId,
    {
      weightKg: calculated.input.weightKg,
      waistCm: calculated.input.waistCm,
      neckCm: calculated.input.neckCm,
      hipCm,
    },
    fullPipeline,
    snapshotReason,
  );
  if (!inputResult.ok) {
    return inputResult;
  }

  if (
    snapshotReason === 'profile_update' &&
    reusedMeasurement &&
    deps.persistMeasurementCircumferencesOnProfile
  ) {
    const persistResult = await deps.persistMeasurementCircumferencesOnProfile(
      profile.userId,
      reusedMeasurement.waistCm,
      reusedMeasurement.neckCm,
    );
    if (!persistResult.ok) {
      return persistResult;
    }
  }

  return deps.createSnapshot(inputResult.value);
}
