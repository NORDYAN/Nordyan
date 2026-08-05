import type { CreateMeasurementInput, Measurement } from '@/lib/domain/measurement';

/** Application-layer submission payload for MeasurementWorkflow. */
export type SubmitMeasurementInput = CreateMeasurementInput;

/**
 * Full workflow completion.
 *
 * Contract policy: when status is `completed`, the approved pipeline finished
 * including snapshot creation. snapshotId is therefore required and non-null.
 */
export type MeasurementWorkflowCompleted = {
  status: 'completed';
  measurement: Measurement;
  snapshotId: string;
};

/**
 * Partial workflow outcome when measurement persistence succeeded but snapshot
 * creation did not. This is an explicit typed outcome — not a nullable field
 * on a success payload.
 */
export type MeasurementSnapshotFailureReason =
  | 'profile_unavailable'
  | 'profile_incomplete'
  | 'pipeline_failed'
  | 'snapshot_persist_failed';

export type MeasurementWorkflowMeasurementPersistedSnapshotFailed = {
  status: 'measurement_persisted_snapshot_failed';
  measurement: Measurement;
  reason: MeasurementSnapshotFailureReason;
};

/**
 * Measurement persisted without snapshot orchestration.
 *
 * Used when the workflow completes persistence only (e.g. before engine
 * integration milestones). Snapshot creation is deferred.
 */
export type MeasurementWorkflowMeasurementPersisted = {
  status: 'measurement_persisted';
  measurement: Measurement;
};

/**
 * Outcome returned by MeasurementWorkflow.submit on a finished orchestration run.
 *
 * Validation failures and unrecoverable workflow failures remain `Result` errors.
 * This union covers successful orchestration paths only.
 */
export type MeasurementWorkflowResult =
  | MeasurementWorkflowCompleted
  | MeasurementWorkflowMeasurementPersistedSnapshotFailed
  | MeasurementWorkflowMeasurementPersisted;
