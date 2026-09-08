import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
  isCurrentHealthDataConsentGrant,
} from '@/lib/domain/health-data-consent';

import { createMemoryPendingKeyValueStore } from './pending-key-value-store';
import {
  createCurrentHealthDataConsentGrant,
  createPendingHealthDataConsentStore,
} from './pending-health-data-consent-store';

describe('pending health data consent store', () => {
  it('stores consent type, policy version, and granted_at for an anonymous grant', async () => {
    const store = createPendingHealthDataConsentStore(createMemoryPendingKeyValueStore());
    const grantedAt = '2026-08-22T12:00:00.000Z';
    await store.savePendingHealthDataConsent(createCurrentHealthDataConsentGrant(grantedAt));

    const pending = await store.getPendingHealthDataConsent();
    assert.deepEqual(pending, {
      consentType: HEALTH_DATA_CONSENT_TYPE,
      policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
      grantedAt,
    });
    assert.equal(isCurrentHealthDataConsentGrant(pending), true);
  });

  it('does not overwrite a bound user grant with an anonymous save', async () => {
    const store = createPendingHealthDataConsentStore(createMemoryPendingKeyValueStore());
    await store.savePendingHealthDataConsent(
      createCurrentHealthDataConsentGrant('2026-08-22T10:00:00.000Z'),
      'user-a',
    );
    await store.savePendingHealthDataConsent(
      createCurrentHealthDataConsentGrant('2026-08-22T11:00:00.000Z'),
    );

    assert.equal((await store.getPendingHealthDataConsentForUser('user-a'))?.grantedAt, '2026-08-22T10:00:00.000Z');
    assert.equal((await store.getPendingHealthDataConsent())?.grantedAt, '2026-08-22T11:00:00.000Z');
    assert.equal(await store.getBindState('user-a'), 'mismatch');
  });

  it('binds an anonymous grant to a user without touching another UUID', async () => {
    const store = createPendingHealthDataConsentStore(createMemoryPendingKeyValueStore());
    await store.savePendingHealthDataConsent(
      createCurrentHealthDataConsentGrant('2026-08-22T09:00:00.000Z'),
      'user-b',
    );
    await store.savePendingHealthDataConsent(createCurrentHealthDataConsentGrant('2026-08-22T10:00:00.000Z'));

    assert.equal(await store.bindPendingHealthDataConsentToUser('user-a'), 'bound');
    assert.equal((await store.getPendingHealthDataConsent()), null);
    assert.equal((await store.getPendingHealthDataConsentForUser('user-a'))?.grantedAt, '2026-08-22T10:00:00.000Z');
    assert.equal((await store.getPendingHealthDataConsentForUser('user-b'))?.grantedAt, '2026-08-22T09:00:00.000Z');
  });

  it('rejects a fabricated historical grant that is not the current policy version', async () => {
    const store = createPendingHealthDataConsentStore(createMemoryPendingKeyValueStore());
    await store.savePendingHealthDataConsent({
      consentType: HEALTH_DATA_CONSENT_TYPE,
      policyVersion: 'privacy-v0',
      grantedAt: '2024-01-01T00:00:00.000Z',
    });

    const pending = await store.getPendingHealthDataConsent();
    assert.equal(pending?.policyVersion, 'privacy-v0');
    assert.equal(isCurrentHealthDataConsentGrant(pending), false);
  });
});
