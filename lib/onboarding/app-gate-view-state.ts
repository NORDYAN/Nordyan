import type { AppGateResult } from '@/lib/onboarding/resolve-app-gate';

export const APP_GATE_LOADING: AppGateResult = { destination: 'loading' };

export function appGateAuthInputsKey(input: {
  isReady: boolean;
  status: string;
  userId: string | null;
}): string {
  return `${input.isReady ? '1' : '0'}:${input.status}:${input.userId ?? ''}`;
}

export function visibleAppGate(input: {
  authInputsKey: string;
  settledInputsKey: string;
  settledGate: AppGateResult;
}): AppGateResult {
  if (input.authInputsKey !== input.settledInputsKey) {
    return APP_GATE_LOADING;
  }

  return input.settledGate;
}

export function applyAppGateIfCurrent<T>(input: {
  requestId: number;
  latestRequestId: number;
  result: T;
}): T | null {
  if (input.requestId !== input.latestRequestId) {
    return null;
  }

  return input.result;
}
