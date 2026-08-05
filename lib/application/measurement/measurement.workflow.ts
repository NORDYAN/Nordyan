import type { Result } from '@/lib/core';

import type {
  MeasurementWorkflowResult,
  SubmitMeasurementInput,
} from './measurement.workflow.types';

/**
 * Measurement Workflow contract.
 *
 * Single approved application orchestrator for measurement submission.
 * Orchestration sequence is defined in docs/MEASUREMENT_MODULE_V1.md.
 */
export interface MeasurementWorkflow {
  /**
   * Submit a measurement and run the approved orchestration pipeline.
   *
   * 1. Validate measurement input
   * 2. Persist measurement (primary)
   * 3. Load profile context
   * 4. Merge profile + measurement into engine input
   * 5. Run Health Snapshot pipeline (engines)
   * 6. Persist snapshot (secondary)
   * 7. Return MeasurementWorkflowResult
   */
  submit(input: SubmitMeasurementInput): Promise<Result<MeasurementWorkflowResult>>;
}
