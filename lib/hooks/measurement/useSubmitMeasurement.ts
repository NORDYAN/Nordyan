import { useCallback, useState } from 'react';

import { measurementWorkflow } from '@/lib/application/measurement';
import type { MeasurementSnapshotFailureReason } from '@/lib/application/measurement';
import type { AppError } from '@/lib/core';
import type { CreateMeasurementInput } from '@/lib/domain/measurement';
import { MEASUREMENT_SAVE_ERROR_MESSAGE } from '@/lib/repositories/measurement-mappers';

export type SubmitMeasurementSuccessOutcome = 'completed' | 'partial';

export type SubmitMeasurementState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; outcome: SubmitMeasurementSuccessOutcome; message: string }
  | { status: 'error'; message: string };

const SUBMIT_SUCCESS_COMPLETED_MESSAGE =
  'Mätningen och hälsosnapshoten har sparats.';

const PARTIAL_SUCCESS_MESSAGES: Record<MeasurementSnapshotFailureReason, string> = {
  profile_unavailable:
    'Mätningen har sparats, men din profil kunde inte läsas. Hälsosnapshoten kunde inte skapas.',
  profile_incomplete:
    'Mätningen har sparats. Komplettera din profil för att beräkna hälsosnapshot.',
  pipeline_failed:
    'Mätningen har sparats, men hälsodata kunde inte beräknas.',
  snapshot_persist_failed:
    'Mätningen har sparats, men hälsosnapshoten kunde inte sparas.',
};

function toUserFacingError(error: AppError): string {
  if (error.code === 'VALIDATION') {
    return error.message;
  }

  return MEASUREMENT_SAVE_ERROR_MESSAGE;
}

export function useSubmitMeasurement() {
  const [state, setState] = useState<SubmitMeasurementState>({ status: 'idle' });

  const submit = useCallback(async (input: CreateMeasurementInput): Promise<boolean> => {
    setState({ status: 'submitting' });

    const result = await measurementWorkflow.submit(input);
    if (!result.ok) {
      setState({ status: 'error', message: toUserFacingError(result.error) });
      return false;
    }

    if (result.value.status === 'completed') {
      setState({
        status: 'success',
        outcome: 'completed',
        message: SUBMIT_SUCCESS_COMPLETED_MESSAGE,
      });
      return true;
    }

    if (result.value.status === 'measurement_persisted_snapshot_failed') {
      setState({
        status: 'success',
        outcome: 'partial',
        message: PARTIAL_SUCCESS_MESSAGES[result.value.reason],
      });
      return true;
    }

    setState({
      status: 'error',
      message: MEASUREMENT_SAVE_ERROR_MESSAGE,
    });
    return false;
  }, []);

  const clearFeedback = useCallback(() => {
    setState({ status: 'idle' });
  }, []);

  return {
    state,
    submit,
    clearFeedback,
  };
}
