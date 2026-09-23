import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateHealthScore } from '@/lib/domain/health-score';
import { shouldShowBodyMeasurementFollowUp } from '@/lib/domain/profile/is-profile-complete';
import type { UserProfile } from '@/lib/domain/profile/types';
import type { Measurement } from '@/lib/domain/measurement';
import type { CreateSnapshotInput, HealthSnapshot } from '@/lib/domain/snapshot';
import { canPresentBodyFatEstimate } from '@/lib/services/health-score/body-fat-presentation';
import { estimatePreliminaryAnthropometrics } from '@/lib/services/health-score/health-score.mapper';
import { mapProfileUpdateToHealthScoreInput } from '@/lib/services/health-score/profile-measurement.mapper';
import { createHealthSnapshotFromProfile } from '@/lib/services/snapshots/snapshot-after-profile-save';

const PROFILE: UserProfile = {
  id: 'profile-1',
  userId: 'user-1',
  firstName: 'Test',
  dateOfBirth: '2006-03-01',
  gender: 'male',
  heightCm: 180,
  weightKg: 80,
  waistCm: null,
  neckCm: null,
  activityLevel: 'moderately_active',
  goal: 'improve_health',
  createdAt: '2026-08-17T10:00:00.000Z',
  updatedAt: '2026-08-17T10:00:00.000Z',
};

const MEASUREMENT: Measurement = {
  id: 'measurement-1',
  userId: 'user-1',
  measuredAt: '2026-09-10',
  weightKg: 78,
  waistCm: 90,
  neckCm: 38,
  hipCm: 102,
  createdAt: '2026-09-10T12:00:00.000Z',
};

function cloneMeasurement(value: Measurement): Measurement {
  return { ...value };
}

function snapshotFromInput(
  input: CreateSnapshotInput,
  id: string,
  createdAt: string,
): HealthSnapshot {
  return {
    id,
    userId: input.userId,
    createdAt,
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
    hipCm: input.hipCm ?? null,
    engineVersion: input.engineVersion,
    snapshotReason: input.snapshotReason,
    bodyFatPct: input.bodyFatPct ?? null,
    coachDurationMinutes: input.coachDurationMinutes ?? null,
    coachFrequencyPerWeek: input.coachFrequencyPerWeek ?? null,
  };
}

function scoreFor(profile: UserProfile, measurement: Measurement | null): number {
  const input = mapProfileUpdateToHealthScoreInput(profile, measurement, '2026-09-21');
  assert.ok(input);
  const result = calculateHealthScore(input);
  assert.equal(result.ok, true);
  if (!result.ok) {
    throw new Error('expected score');
  }
  return result.value.score;
}

describe('createHealthSnapshotFromProfile — preserve real measurement', () => {
  it('reuses the latest real measurement on activity-only profile update', async () => {
    const measurements = [cloneMeasurement(MEASUREMENT)];
    const originalMeasurementSnapshot: HealthSnapshot = {
      id: 'snap-measurement',
      userId: 'user-1',
      createdAt: '2026-09-10T12:00:00.000Z',
      overallScore: 70,
      bmiScore: 70,
      whtrScore: 68,
      bodyFatScore: 81,
      activityScore: 68,
      primaryFocus: 'improve_activity',
      coachRecommendationId: 'activity_brisk_walk_v1',
      weightKg: MEASUREMENT.weightKg,
      waistCm: MEASUREMENT.waistCm,
      neckCm: MEASUREMENT.neckCm,
      hipCm: MEASUREMENT.hipCm,
      engineVersion: '1.0.0|1.0.0|1.0.0',
      snapshotReason: 'measurement',
      bodyFatPct: 18.5,
      coachDurationMinutes: 20,
      coachFrequencyPerWeek: 4,
    };
    const historicalSnapshots = [originalMeasurementSnapshot];
    const persisted: Array<{ waistCm: number; neckCm: number }> = [];
    let created: CreateSnapshotInput | null = null;

    const activeProfile: UserProfile = { ...PROFILE, activityLevel: 'very_active' };
    const before = scoreFor({ ...PROFILE }, MEASUREMENT);
    const after = scoreFor(activeProfile, MEASUREMENT);
    const imputed = estimatePreliminaryAnthropometrics(180, 80, 'male');

    const result = await createHealthSnapshotFromProfile(activeProfile, 'profile_update', undefined, {
      async getLatestMeasurement() {
        return { ok: true, value: measurements[0]! };
      },
      async persistMeasurementCircumferencesOnProfile(_userId, waistCm, neckCm) {
        persisted.push({ waistCm, neckCm });
        return {
          ok: true,
          value: { ...activeProfile, waistCm, neckCm },
        };
      },
      async createSnapshot(input) {
        created = input;
        return { ok: true, value: snapshotFromInput(input, 'snap-profile-update', '2026-09-21T18:00:00.000Z') };
      },
    });

    assert.equal(result.ok, true);
    assert.ok(created);
    assert.equal(created.snapshotReason, 'profile_update');
    assert.equal(created.waistCm, MEASUREMENT.waistCm);
    assert.equal(created.neckCm, MEASUREMENT.neckCm);
    assert.equal(created.hipCm, MEASUREMENT.hipCm);
    assert.equal(created.weightKg, MEASUREMENT.weightKg);
    assert.notEqual(created.waistCm, imputed.waistCm);
    assert.notEqual(created.neckCm, imputed.neckCm);
    assert.ok(created.bodyFatPct != null);
    assert.ok(Math.abs((created.bodyFatPct ?? 0) - 18.5) < 4);

    assert.deepEqual(measurements, [MEASUREMENT]);
    assert.deepEqual(historicalSnapshots, [originalMeasurementSnapshot]);
    assert.deepEqual(persisted, [{ waistCm: MEASUREMENT.waistCm, neckCm: MEASUREMENT.neckCm }]);

    const profileAfterPersist: UserProfile = {
      ...activeProfile,
      waistCm: MEASUREMENT.waistCm,
      neckCm: MEASUREMENT.neckCm,
    };
    const latest = snapshotFromInput(created, 'snap-profile-update', '2026-09-21T18:00:00.000Z');
    assert.equal(
      canPresentBodyFatEstimate(profileAfterPersist, {
        waistCm: latest.waistCm,
        neckCm: latest.neckCm,
        hipCm: latest.hipCm,
        snapshotReason: latest.snapshotReason,
        bodyFatPct: latest.bodyFatPct,
      }),
      true,
    );
    assert.equal(shouldShowBodyMeasurementFollowUp(profileAfterPersist, latest), false);

    const delta = after - before;
    assert.ok(delta >= 3 && delta <= 4, `expected activity-only delta 3–4, got ${delta}`);
    assert.notEqual(delta, 14);
  });

  it('keeps imputed composition when there is no real measurement', async () => {
    const skipped: UserProfile = { ...PROFILE };
    const imputed = estimatePreliminaryAnthropometrics(
      skipped.heightCm!,
      skipped.weightKg!,
      'male',
    );
    let created: CreateSnapshotInput | null = null;
    let persistCalls = 0;

    const result = await createHealthSnapshotFromProfile(skipped, 'profile_update', undefined, {
      async getLatestMeasurement() {
        return { ok: true, value: null };
      },
      async persistMeasurementCircumferencesOnProfile() {
        persistCalls += 1;
        return { ok: true, value: skipped };
      },
      async createSnapshot(input) {
        created = input;
        return { ok: true, value: snapshotFromInput(input, 'snap-imputed', '2026-09-21T18:00:00.000Z') };
      },
    });

    assert.equal(result.ok, true);
    assert.ok(created);
    assert.equal(created.snapshotReason, 'profile_update');
    assert.equal(created.waistCm, imputed.waistCm);
    assert.equal(created.neckCm, imputed.neckCm);
    assert.equal(persistCalls, 0);

    const latest = snapshotFromInput(created, 'snap-imputed', '2026-09-21T18:00:00.000Z');
    assert.equal(
      canPresentBodyFatEstimate(skipped, {
        waistCm: latest.waistCm,
        neckCm: latest.neckCm,
        snapshotReason: latest.snapshotReason,
        bodyFatPct: latest.bodyFatPct,
      }),
      false,
    );
    assert.equal(shouldShowBodyMeasurementFollowUp(skipped, latest), true);
  });

  it('does not mutate or delete the existing measurements row or measurement snapshot', async () => {
    const measurements = [cloneMeasurement(MEASUREMENT)];
    const originalSnapshot = {
      id: 'snap-measurement',
      snapshotReason: 'measurement' as const,
      waistCm: MEASUREMENT.waistCm,
      neckCm: MEASUREMENT.neckCm,
      bodyFatPct: 18.5,
    };
    const snapshots = [originalSnapshot];

    await createHealthSnapshotFromProfile(
      { ...PROFILE, activityLevel: 'very_active' },
      'profile_update',
      undefined,
      {
        async getLatestMeasurement() {
          return { ok: true, value: measurements[0]! };
        },
        async persistMeasurementCircumferencesOnProfile() {
          return {
            ok: true,
            value: {
              ...PROFILE,
              activityLevel: 'very_active',
              waistCm: MEASUREMENT.waistCm,
              neckCm: MEASUREMENT.neckCm,
            },
          };
        },
        async createSnapshot(input) {
          return {
            ok: true,
            value: snapshotFromInput(input, 'snap-new', '2026-09-21T18:00:00.000Z'),
          };
        },
      },
    );

    assert.deepEqual(measurements[0], MEASUREMENT);
    assert.equal(measurements.length, 1);
    assert.deepEqual(snapshots, [originalSnapshot]);
  });

  it('does not look up measurements when creating an onboarding snapshot', async () => {
    let measurementLookups = 0;
    let persistCalls = 0;

    const result = await createHealthSnapshotFromProfile(PROFILE, 'onboarding', undefined, {
      async getLatestMeasurement() {
        measurementLookups += 1;
        return { ok: true, value: MEASUREMENT };
      },
      async persistMeasurementCircumferencesOnProfile() {
        persistCalls += 1;
        return { ok: true, value: PROFILE };
      },
      async createSnapshot(input) {
        const imputed = estimatePreliminaryAnthropometrics(180, 80, 'male');
        assert.equal(input.snapshotReason, 'onboarding');
        assert.equal(input.waistCm, imputed.waistCm);
        return { ok: true, value: snapshotFromInput(input, 'snap-onboarding', '2026-08-17T10:00:00.000Z') };
      },
    });

    assert.equal(result.ok, true);
    assert.equal(measurementLookups, 0);
    assert.equal(persistCalls, 0);
  });
});
