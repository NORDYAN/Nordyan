import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { healthDataConsentPresenceFromRepositoryResult } from './consent-presence';

describe('healthDataConsentPresenceFromRepositoryResult', () => {
  it('distinguishes repository errors from a valid empty consent query', () => {
    assert.equal(
      healthDataConsentPresenceFromRepositoryResult({
        ok: false,
        error: { code: 'INTEGRATION', message: 'permission denied' },
      }),
      'error',
    );
    assert.equal(
      healthDataConsentPresenceFromRepositoryResult({ ok: true, value: false }),
      'absent',
    );
    assert.equal(
      healthDataConsentPresenceFromRepositoryResult({ ok: true, value: true }),
      'active',
    );
  });
});
