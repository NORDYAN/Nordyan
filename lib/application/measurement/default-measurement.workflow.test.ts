import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Result } from '../../core';
import type { CreateMeasurementInput, Measurement } from '../../domain/measurement';
import type { UserProfile } from '../../domain/profile';
import type { CreateSnapshotInput, HealthSnapshot } from '../../domain/snapshot';
import type { MeasurementRepository } from '../../repositories/measurement.repository';
import type { ProfileRepository } from '../../repositories/profile.repository';
import type { SnapshotService } from '../../services/snapshots/snapshot.service.types';

import { getTodayLocalDate } from './measurement-date.utils';
import { DefaultMeasurementWorkflow } from './default-measurement.workflow';

const today = getTodayLocalDate();

const validInput: CreateMeasurementInput = {
  userId: 'user-1',
  measuredAt: today,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  hipCm: 98,
};

const persistedMeasurement: Measurement = {
  id: 'measurement-1',
  userId: validInput.userId,
  measuredAt: validInput.measuredAt,
  weightKg: validInput.weightKg,
  waistCm: validInput.waistCm,
  neckCm: validInput.neckCm,
  hipCm: validInput.hipCm,
  createdAt: '2026-08-16T12:00:00.000Z',
};

const completeProfile: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Test',
  dateOfBirth: '1980-01-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

function measurementRepository(): MeasurementRepository {
  return {
    async create(input) {
      return {
        ok: true,
        value: {
          ...persistedMeasurement,
          ...input,
        },
      };
    },
  };
}

function profileRepository(profile: UserProfile | null): ProfileRepository {
  return {
    async getByUserId() {
      return { ok: true, value: profile };
    },
    async createFromMeasurements() {
      throw new Error('createFromMeasurements is not used by measurement submit');
    },
    async update() {
      throw new Error('update is not used by measurement submit');
    },
  };
}

function snapshotService(options?: {
  onCreate?: (input: CreateSnapshotInput) => void;
  failCreate?: boolean;
}): SnapshotService {
  return {
    async createSnapshot(input) {
      options?.onCreate?.(input);
      if (options?.failCreate) {
        return { ok: false, error: { code: 'INTEGRATION', message: 'snapshot persist failed' } };
      }

      const snapshot: HealthSnapshot = {
        id: 'snapshot-1',
        userId: input.userId,
        createdAt: '2026-08-16T12:00:00.000Z',
        overallScore: input.overallScore,
        bmiScore: input.bmiScore,
        whtrScore: input.whtrScore,
        bodyFatScore: input.bodyFatScore,
        activityScore: input.activityScore,
        primaryFocus: input.primaryFocus,
        coachRecommendationId: input.coachRecommendationId,
        weightKg: input.weightKg,
        waistCm: input.waistCm,
        neckCm: input.neckCm,
        hipCm: input.hipCm,
        engineVersion: input.engineVersion,
        snapshotReason: input.snapshotReason,
        bodyFatPct: input.bodyFatPct ?? null,
        coachDurationMinutes: input.coachDurationMinutes ?? null,
        coachFrequencyPerWeek: input.coachFrequencyPerWeek ?? null,
      };

      return { ok: true, value: snapshot };
    },
    async getLatestSnapshot(): Promise<Result<HealthSnapshot | null>> {
      return { ok: true, value: null };
    },
    async getSnapshotHistory() {
      return { ok: true, value: [] };
    },
    async getSnapshotHistoryInRange() {
      return { ok: true, value: [] };
    },
  };
}

describe('DefaultMeasurementWorkflow.submit', () => {
  it('keeps the measurement row when snapshot creation is skipped for an incomplete profile', async () => {
    let snapshotCreates = 0;
    const workflow = new DefaultMeasurementWorkflow(
      measurementRepository(),
      profileRepository({ ...completeProfile, dateOfBirth: null }),
      snapshotService({
        onCreate: () => {
          snapshotCreates += 1;
        },
      }),
    );

    const result = await workflow.submit(validInput);

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.value.status, 'measurement_persisted_snapshot_failed');
    if (result.value.status !== 'measurement_persisted_snapshot_failed') {
      return;
    }

    assert.equal(result.value.reason, 'profile_incomplete');
    assert.equal(result.value.measurement.id, 'measurement-1');
    assert.equal(result.value.measurement.weightKg, validInput.weightKg);
    assert.equal(snapshotCreates, 0);
  });

  it('still runs the snapshot pipeline on completed measurement save', async () => {
    const reasons: string[] = [];
    const workflow = new DefaultMeasurementWorkflow(
      measurementRepository(),
      profileRepository(completeProfile),
      snapshotService({
        onCreate: (input) => {
          reasons.push(input.snapshotReason);
        },
      }),
    );

    const result = await workflow.submit(validInput);

    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.value.status, 'completed');
    if (result.value.status !== 'completed') {
      return;
    }

    assert.equal(result.value.measurement.id, 'measurement-1');
    assert.equal(result.value.snapshotId, 'snapshot-1');
    assert.deepEqual(reasons, ['measurement']);
  });

  it('passes hip through the measurement snapshot pipeline without imputing', async () => {
    let hipCm: number | null | undefined;
    const workflow = new DefaultMeasurementWorkflow(
      measurementRepository(),
      profileRepository(completeProfile),
      snapshotService({
        onCreate: (input) => {
          hipCm = input.hipCm;
        },
      }),
    );

    const result = await workflow.submit(validInput);
    assert.equal(result.ok, true);
    assert.equal(hipCm, 98);
  });
});
