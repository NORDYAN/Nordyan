import { supabaseMeasurementRepository } from '@/lib/repositories/supabase-measurement.repository';
import { supabaseProfileRepository } from '@/lib/repositories/supabase-profile.repository';
import { snapshotService } from '@/lib/services/snapshots/snapshot.service';

import { DefaultMeasurementWorkflow } from './default-measurement.workflow';

export type {
  MeasurementSnapshotFailureReason,
  MeasurementWorkflowCompleted,
  MeasurementWorkflowMeasurementPersisted,
  MeasurementWorkflowMeasurementPersistedSnapshotFailed,
  MeasurementWorkflowResult,
  SubmitMeasurementInput,
} from './measurement.workflow.types';

export type { MeasurementWorkflow } from './measurement.workflow';
export { DefaultMeasurementWorkflow } from './default-measurement.workflow';

export const measurementWorkflow = new DefaultMeasurementWorkflow(
  supabaseMeasurementRepository,
  supabaseProfileRepository,
  snapshotService,
);
