import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculateHealthScore } from '@/lib/domain/health-score';
import { COACH_ASK_ALL_FORBIDDEN_FIELDS } from '@/shared/coach-language';
import { nb } from '@/lib/i18n/resources/nb';
import { sv } from '@/lib/i18n/resources/sv';
import { mapMeasurementRow, measurementToInsert } from '@/lib/repositories/measurement-mappers';
import { canPresentBodyFatEstimate } from '@/lib/services/health-score/body-fat-presentation';
import { mapProfileToHealthScoreInput } from '@/lib/services/health-score/health-score.mapper';
import { mapProfileAndMeasurementToHealthScoreInput } from '@/lib/services/health-score/profile-measurement.mapper';
import { buildCreateSnapshotInputFromPipeline, runHealthSnapshotPipeline } from '@/lib/services/snapshots/health-snapshot-pipeline';
import { routes } from '@/constants/routes';

import { measurementValidator } from './measurement.validator';
import { resolveOptionalHipCm } from './hip-cm';
import type { CreateMeasurementInput } from './measurement.types';

const today = '2026-08-23';

const maleInput = {
  dateOfBirth: '1985-01-01',
  gender: 'male' as const,
  heightCm: 180,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  activityLevel: 'moderate' as const,
  asOfDate: today,
};

const femaleBase = {
  dateOfBirth: '1988-03-12',
  gender: 'female' as const,
  heightCm: 168,
  weightKg: 64,
  waistCm: 80,
  neckCm: 33,
  activityLevel: 'moderate' as const,
  asOfDate: today,
};

const newMeasurement: CreateMeasurementInput = {
  userId: 'user-1',
  measuredAt: today,
  weightKg: 80,
  waistCm: 90,
  neckCm: 38,
  hipCm: 98,
};

describe('Hip Measurement + Female Body Fat v1', () => {
  it('does not let hip change the male US Navy body-fat result', () => {
    const withoutHip = calculateHealthScore(maleInput);
    const withHip = calculateHealthScore({ ...maleInput, hipCm: 102 });
    assert.equal(withoutHip.ok, true);
    assert.equal(withHip.ok, true);
    if (!withoutHip.ok || !withHip.ok) {
      return;
    }

    assert.equal(withoutHip.value.metrics.bodyFatMethod, 'us_navy');
    assert.equal(withHip.value.metrics.bodyFatMethod, 'us_navy');
    assert.equal(withoutHip.value.metrics.bodyFatPct, withHip.value.metrics.bodyFatPct);
  });

  it('produces a presentable female US Navy estimate when waist, neck, hip, and height are valid', () => {
    const result = calculateHealthScore({ ...femaleBase, hipCm: 98 });
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.value.metrics.bodyFatMethod, 'us_navy');
    assert.equal(Number.isFinite(result.value.metrics.bodyFatPct), true);
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: 98,
          snapshotReason: 'measurement',
          bodyFatPct: result.value.metrics.bodyFatPct,
        },
      ),
      true,
    );
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: 98,
          snapshotReason: 'onboarding',
          bodyFatPct: result.value.metrics.bodyFatPct,
          bodyFatMethod: result.value.metrics.bodyFatMethod,
        },
      ),
      true,
    );
  });

  it('keeps Home body fat unavailable for female legacy measurements without hip', () => {
    const result = calculateHealthScore(femaleBase);
    assert.equal(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.equal(result.value.metrics.bodyFatMethod, 'deurenberg');
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: null,
          snapshotReason: 'measurement',
          bodyFatPct: result.value.metrics.bodyFatPct,
        },
      ),
      false,
    );
  });

  it('persists hip to measurements.hip_cm and leaves legacy null hip readable', () => {
    const insert = measurementToInsert(newMeasurement);
    assert.equal(insert.hip_cm, 98);

    const legacy = mapMeasurementRow({
      id: 'legacy-1',
      user_id: 'user-1',
      measured_at: today,
      weight_kg: 80,
      waist_cm: 90,
      neck_cm: 38,
      hip_cm: null,
      created_at: '2026-01-01T00:00:00.000Z',
    });
    assert.equal(legacy.hipCm, null);
  });

  it('persists hip to measurement health_snapshots.hip_cm and does not impute when missing', () => {
    const withHip = runHealthSnapshotPipeline({ ...femaleBase, hipCm: 98 }, 'improve_health');
    assert.equal(withHip.ok, true);
    if (!withHip.ok) {
      return;
    }

    const snapshotWithHip = buildCreateSnapshotInputFromPipeline(
      'user-1',
      { weightKg: 64, waistCm: 80, neckCm: 33, hipCm: 98 },
      withHip.value,
      'measurement',
    );
    assert.equal(snapshotWithHip.ok, true);
    if (snapshotWithHip.ok) {
      assert.equal(snapshotWithHip.value.hipCm, 98);
    }

    const withoutHip = runHealthSnapshotPipeline(femaleBase, 'improve_health');
    assert.equal(withoutHip.ok, true);
    if (!withoutHip.ok) {
      return;
    }

    const snapshotWithoutHip = buildCreateSnapshotInputFromPipeline(
      'user-1',
      { weightKg: 64, waistCm: 80, neckCm: 33 },
      withoutHip.value,
      'onboarding',
    );
    assert.equal(snapshotWithoutHip.ok, true);
    if (snapshotWithoutHip.ok) {
      assert.equal(snapshotWithoutHip.value.hipCm, null);
    }

    assert.equal(resolveOptionalHipCm(null), undefined);
    assert.equal(resolveOptionalHipCm(undefined), undefined);
  });

  it('requires hip on new measurements for both male and female users', () => {
    const context = { todayLocalDate: today };
    assert.equal(measurementValidator.validate(newMeasurement, context).valid, true);
    assert.equal(
      measurementValidator.validate({ ...newMeasurement, hipCm: Number.NaN }, context).valid,
      false,
    );
    assert.equal(
      measurementValidator.validate({ ...newMeasurement, hipCm: 20 }, context).valid,
      false,
    );
  });

  it('keeps reminder and + on the same measurement workflow route', () => {
    assert.equal(routes.healthNewMeasurement, '/(tabs)/health/new-measurement');
  });

  it('supports onboarding hip when entered and does not fabricate hip on skip', () => {
    const profile = {
      id: 'p1',
      userId: 'u1',
      firstName: 'Test',
      dateOfBirth: '1988-03-12',
      gender: 'female' as const,
      heightCm: 168,
      weightKg: 64,
      waistCm: 80,
      neckCm: 33,
      activityLevel: 'moderately_active' as const,
      goal: 'improve_health' as const,
      createdAt: '',
      updatedAt: '',
    };

    const withHip = mapProfileToHealthScoreInput(profile, today, { hipCm: 98 });
    assert.equal(withHip?.hipCm, 98);

    const skipped = mapProfileToHealthScoreInput(
      { ...profile, waistCm: null, neckCm: null },
      today,
    );
    assert.equal(skipped?.hipCm, undefined);
  });

  it('contains hip instructions in sv and nb', () => {
    assert.equal(sv['measureHelp.hipHeading'], 'Höft');
    assert.match(sv['measureHelp.hip.1'], /bredaste delen av höften/);
    assert.equal(nb['measureHelp.hipHeading'], 'Hofte');
    assert.match(nb['measureHelp.hip.1'], /bredeste delen av hoftene/);
  });

  it('does not expose a female Deurenberg snapshot as presentable body fat', () => {
    assert.equal(
      canPresentBodyFatEstimate(
        { gender: 'female', waistCm: 80, neckCm: 33, heightCm: 168 },
        {
          waistCm: 80,
          neckCm: 33,
          hipCm: null,
          snapshotReason: 'onboarding',
          bodyFatPct: 31.2,
        },
      ),
      false,
    );
  });

  it('keeps hip out of Coach Ask and uses shared presentable body-fat only', () => {
    assert.equal((COACH_ASK_ALL_FORBIDDEN_FIELDS as readonly string[]).includes('hipCm'), true);
    const measurement = {
      id: 'm1',
      userId: 'u1',
      measuredAt: today,
      weightKg: 64,
      waistCm: 80,
      neckCm: 33,
      hipCm: 98,
      createdAt: '',
    };
    const profile = {
      id: 'p1',
      userId: 'u1',
      firstName: null,
      dateOfBirth: '1988-03-12',
      gender: 'female' as const,
      heightCm: 168,
      weightKg: 64,
      waistCm: null,
      neckCm: null,
      activityLevel: 'moderately_active' as const,
      goal: 'improve_health' as const,
      createdAt: '',
      updatedAt: '',
    };
    const input = mapProfileAndMeasurementToHealthScoreInput(profile, measurement);
    assert.equal(input?.hipCm, 98);
    assert.equal((COACH_ASK_ALL_FORBIDDEN_FIELDS as readonly string[]).includes('hip'), true);
  });
});
