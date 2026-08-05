import type { AppError, Result } from '@/lib/core';
import type { Measurement, MeasurementValidator } from '@/lib/domain/measurement';
import { measurementValidator } from '@/lib/domain/measurement';
import type { ProfileRepository } from '@/lib/repositories/profile.repository';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';
import type { MeasurementRepository } from '@/lib/repositories/measurement.repository';
import { supabaseMeasurementRepository } from '@/lib/repositories/supabase-measurement.repository';
import { mapProfileAndMeasurementToHealthScoreInput } from '@/lib/services/health-score/profile-measurement.mapper';
import {
  buildCreateSnapshotInputFromPipeline,
  runHealthSnapshotPipeline,
} from '@/lib/services/snapshots/health-snapshot-pipeline';
import { snapshotService } from '@/lib/services/snapshots/snapshot.service';
import type { SnapshotService } from '@/lib/services/snapshots/snapshot.service.types';

import { getTodayLocalDate } from './measurement-date.utils';
import type { MeasurementWorkflow } from './measurement.workflow';
import type {
  MeasurementSnapshotFailureReason,
  MeasurementWorkflowMeasurementPersistedSnapshotFailed,
  MeasurementWorkflowResult,
  SubmitMeasurementInput,
} from './measurement.workflow.types';

function validationErrorMessage(errors: Array<{ message: string }>): AppError {
  return {
    code: 'VALIDATION',
    message: errors[0]?.message ?? 'Ogiltiga mätvärden.',
  };
}

function partialSnapshotFailure(
  measurement: Measurement,
  reason: MeasurementSnapshotFailureReason,
): MeasurementWorkflowMeasurementPersistedSnapshotFailed {
  return {
    status: 'measurement_persisted_snapshot_failed',
    measurement,
    reason,
  };
}

export class DefaultMeasurementWorkflow implements MeasurementWorkflow {
  constructor(
    private readonly measurementRepository: MeasurementRepository,
    private readonly profileRepository: ProfileRepository,
    private readonly snapshots: SnapshotService,
    private readonly validator: MeasurementValidator = measurementValidator,
  ) {}

  async submit(input: SubmitMeasurementInput): Promise<Result<MeasurementWorkflowResult>> {
    const validation = this.validator.validate(input, {
      todayLocalDate: getTodayLocalDate(),
    });

    if (!validation.valid) {
      return { ok: false, error: validationErrorMessage(validation.errors) };
    }

    const persistResult = await this.measurementRepository.create(input);
    if (!persistResult.ok) {
      return persistResult;
    }

    const measurement = persistResult.value;

    const profileResult = await this.profileRepository.getByUserId(input.userId);
    if (!profileResult.ok) {
      if (__DEV__) {
        console.error('[measurement-workflow] profile load failed', profileResult.error);
      }

      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'profile_unavailable'),
      };
    }

    if (!profileResult.value) {
      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'profile_unavailable'),
      };
    }

    const profile = profileResult.value;
    const healthScoreInput = mapProfileAndMeasurementToHealthScoreInput(profile, measurement);
    if (!healthScoreInput) {
      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'profile_incomplete'),
      };
    }

    const pipelineResult = runHealthSnapshotPipeline(healthScoreInput, profile.goal);
    if (!pipelineResult.ok) {
      if (__DEV__) {
        console.error('[measurement-workflow] pipeline failed', pipelineResult.error);
      }

      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'pipeline_failed'),
      };
    }

    const snapshotInputResult = buildCreateSnapshotInputFromPipeline(
      measurement.userId,
      {
        weightKg: measurement.weightKg,
        waistCm: measurement.waistCm,
        neckCm: measurement.neckCm,
      },
      pipelineResult.value,
      'measurement',
    );
    if (!snapshotInputResult.ok) {
      if (__DEV__) {
        console.error('[measurement-workflow] snapshot input failed', snapshotInputResult.error);
      }

      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'pipeline_failed'),
      };
    }

    const snapshotResult = await this.snapshots.createSnapshot(snapshotInputResult.value);
    if (!snapshotResult.ok) {
      if (__DEV__) {
        console.error('[measurement-workflow] snapshot persist failed', snapshotResult.error);
      }

      return {
        ok: true,
        value: partialSnapshotFailure(measurement, 'snapshot_persist_failed'),
      };
    }

    return {
      ok: true,
      value: {
        status: 'completed',
        measurement,
        snapshotId: snapshotResult.value.id,
      },
    };
  }
}

export const measurementWorkflow = new DefaultMeasurementWorkflow(
  supabaseMeasurementRepository,
  supabaseProfileRepository,
  snapshotService,
);
