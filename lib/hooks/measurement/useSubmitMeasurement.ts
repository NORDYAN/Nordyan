import { useCallback, useState } from 'react';

import { measurementWorkflow } from '@/lib/application/measurement';
import type { MeasurementSnapshotFailureReason } from '@/lib/application/measurement';
import type { AppError } from '@/lib/core';
import type { CreateMeasurementInput } from '@/lib/domain/measurement';
import { t } from '@/lib/i18n';

export type SubmitMeasurementSuccessOutcome = 'completed' | 'partial';

export type SubmitMeasurementState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; outcome: SubmitMeasurementSuccessOutcome; message: string }
  | { status: 'error'; message: string };

const PARTIAL_SUCCESS_KEYS: Record<MeasurementSnapshotFailureReason, Parameters<typeof t>[0]> = {
  profile_unavailable: 'health.new.partial.profileUnavailable',
  profile_incomplete: 'health.new.partial.profileIncomplete',
  pipeline_failed: 'health.new.partial.pipelineFailed',
  snapshot_persist_failed: 'health.new.partial.snapshotPersistFailed',
};

function toUserFacingError(error: AppError): string {
  if (error.code === 'VALIDATION') {
    return error.message;
  }

  return t('health.saveError');
}

export function useSubmitMeasurement() {
  const [state, setState] = useState<SubmitMeasurementState>({ status: 'idle' });

  const submit = useCallback(async (
    input: CreateMeasurementInput,
  ): Promise<SubmitMeasurementSuccessOutcome | false> => {
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
        message: t('health.new.success'),
      });
      return 'completed';
    }

    if (result.value.status === 'measurement_persisted_snapshot_failed') {
      setState({
        status: 'success',
        outcome: 'partial',
        message: t(PARTIAL_SUCCESS_KEYS[result.value.reason]),
      });
      return 'partial';
    }

    setState({
      status: 'error',
      message: t('health.saveError'),
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
