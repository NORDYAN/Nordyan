import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveUnauthenticatedAppGate } from './resolve-unauthenticated-app-gate';

describe('resolveUnauthenticatedAppGate', () => {
  it('stays loading until auth is ready', () => {
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: false,
        pendingVerificationEmail: null,
      }),
      { destination: 'loading' },
    );
  });

  it('sends unauthenticated cold start to onboarding intro, not sign-in', () => {
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );
  });

  it('restores check-email from persisted verification-wait email', () => {
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: 'jan@nordyan.se',
      }),
      { destination: 'check-email', email: 'jan@nordyan.se' },
    );
  });

  it('does not restore check-email after the wait record is cleared', () => {
    assert.notDeepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'check-email' },
    );
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );
  });

  it('ignores a verification-wait record without a usable email', () => {
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: 'not-an-email',
      }),
      { destination: 'onboarding' },
    );
  });
});
