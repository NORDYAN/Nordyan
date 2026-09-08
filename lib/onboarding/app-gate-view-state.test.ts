import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  APP_GATE_LOADING,
  appGateAuthInputsKey,
  applyAppGateIfCurrent,
  visibleAppGate,
} from './app-gate-view-state';
import { resolveUnauthenticatedAppGate } from './resolve-unauthenticated-app-gate';

describe('app gate view state', () => {
  it('invalidates a stale unauthenticated Redirect when auth becomes authenticated', () => {
    const previousKey = appGateAuthInputsKey({
      isReady: true,
      status: 'unauthenticated',
      userId: null,
    });
    const nextKey = appGateAuthInputsKey({
      isReady: true,
      status: 'authenticated',
      userId: 'user-1',
    });

    const visible = visibleAppGate({
      authInputsKey: nextKey,
      settledInputsKey: previousKey,
      settledGate: { destination: 'check-email', email: 'jan@nordyan.se' },
    });

    assert.deepEqual(visible, APP_GATE_LOADING);
    assert.notEqual(visible.destination, 'check-email');
    assert.notEqual(visible.destination, 'onboarding');
    assert.notEqual(visible.destination, 'home');
  });

  it('keeps loading until the authenticated gate has settled for the current auth inputs', () => {
    const key = appGateAuthInputsKey({
      isReady: true,
      status: 'authenticated',
      userId: 'user-1',
    });

    assert.deepEqual(
      visibleAppGate({
        authInputsKey: key,
        settledInputsKey: key,
        settledGate: APP_GATE_LOADING,
      }),
      APP_GATE_LOADING,
    );

    assert.deepEqual(
      visibleAppGate({
        authInputsKey: key,
        settledInputsKey: key,
        settledGate: { destination: 'home' },
      }),
      { destination: 'home' },
    );
  });

  it('does not let an older unauthenticated resolution overwrite a newer authenticated one', () => {
    const older = applyAppGateIfCurrent({
      requestId: 1,
      latestRequestId: 2,
      result: { destination: 'check-email', email: 'jan@nordyan.se' } as const,
    });
    const newer = applyAppGateIfCurrent({
      requestId: 2,
      latestRequestId: 2,
      result: { destination: 'home' } as const,
    });

    assert.equal(older, null);
    assert.deepEqual(newer, { destination: 'home' });
  });

  it('keeps normal unauthenticated startup on onboarding or check-email', async () => {
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );

    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: 'jan@nordyan.se',
      }),
      { destination: 'check-email', email: 'jan@nordyan.se' },
    );
  });

  it('keeps a settled authenticated startup Redirect once inputs match', () => {
    const key = appGateAuthInputsKey({
      isReady: true,
      status: 'authenticated',
      userId: 'user-1',
    });

    assert.deepEqual(
      visibleAppGate({
        authInputsKey: key,
        settledInputsKey: key,
        settledGate: { destination: 'home' },
      }),
      { destination: 'home' },
    );
    assert.deepEqual(
      visibleAppGate({
        authInputsKey: key,
        settledInputsKey: key,
        settledGate: { destination: 'onboarding' },
      }),
      { destination: 'onboarding' },
    );
  });
});
