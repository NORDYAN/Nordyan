import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from '@/lib/domain/health-data-consent';

import { persistPendingHealthDataConsent } from './persist-pending-health-data-consent';

describe('persistPendingHealthDataConsent', () => {
  const currentGrant = {
    consentType: HEALTH_DATA_CONSENT_TYPE,
    policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
    grantedAt: '2026-08-22T08:15:00.000Z',
  };

  it('inserts the pending grant after auth and clears local storage only after a successful write', async () => {
    const events: string[] = [];

    const result = await persistPendingHealthDataConsent('user-1', {
      getBindState: async () => 'bindable',
      bindToUser: async () => {
        events.push('bound');
        return 'bound';
      },
      getPendingForUser: async () => currentGrant,
      hasActiveCurrentConsent: async () => false,
      insertGrant: async (_userId, grant) => {
        events.push(`insert:${grant.grantedAt}`);
        return { ok: true, value: { inserted: true } };
      },
      clearPendingForUser: async () => {
        events.push('cleared');
      },
    });

    assert.deepEqual(result, { ok: true, value: { persisted: true } });
    assert.deepEqual(events, ['bound', 'insert:2026-08-22T08:15:00.000Z', 'cleared']);
  });

  it('does not clear the pending grant when the server write fails', async () => {
    let cleared = 0;
    const result = await persistPendingHealthDataConsent('user-1', {
      getBindState: async () => 'already_bound',
      bindToUser: async () => 'already_bound',
      getPendingForUser: async () => currentGrant,
      hasActiveCurrentConsent: async () => false,
      insertGrant: async () => ({
        ok: false,
        error: { code: 'NETWORK', message: 'unavailable' },
      }),
      clearPendingForUser: async () => {
        cleared += 1;
      },
    });

    assert.equal(result.ok, false);
    assert.equal(cleared, 0);
  });

  it('does not persist a previous policy version or fabricate a current grant', async () => {
    let inserts = 0;
    const result = await persistPendingHealthDataConsent('user-1', {
      getBindState: async () => 'already_bound',
      bindToUser: async () => 'already_bound',
      getPendingForUser: async () => ({
        consentType: HEALTH_DATA_CONSENT_TYPE,
        policyVersion: 'privacy-v0',
        grantedAt: '2024-01-01T00:00:00.000Z',
      }),
      hasActiveCurrentConsent: async () => false,
      insertGrant: async () => {
        inserts += 1;
        return { ok: true, value: { inserted: true } };
      },
      clearPendingForUser: async () => {},
    });

    assert.deepEqual(result, { ok: true, value: { persisted: false } });
    assert.equal(inserts, 0);
  });

  it('does not attach a mismatched anonymous grant to another user', async () => {
    let binds = 0;
    const result = await persistPendingHealthDataConsent('user-1', {
      getBindState: async () => 'mismatch',
      bindToUser: async () => {
        binds += 1;
        return 'mismatch';
      },
      getPendingForUser: async () => null,
      hasActiveCurrentConsent: async () => false,
      insertGrant: async () => ({ ok: true, value: { inserted: true } }),
      clearPendingForUser: async () => {},
    });

    assert.deepEqual(result, { ok: true, value: { persisted: false } });
    assert.equal(binds, 0);
  });

  it('still inserts a user-owned current grant when leftover anonymous pending exists', async () => {
    let binds = 0;
    let inserts = 0;
    const result = await persistPendingHealthDataConsent('user-1', {
      getBindState: async () => 'mismatch',
      bindToUser: async () => {
        binds += 1;
        return 'mismatch';
      },
      getPendingForUser: async () => currentGrant,
      hasActiveCurrentConsent: async () => false,
      insertGrant: async (_userId, grant) => {
        inserts += 1;
        assert.equal(grant.policyVersion, HEALTH_DATA_CONSENT_POLICY_VERSION);
        return { ok: true, value: { inserted: true } };
      },
      clearPendingForUser: async () => {},
    });

    assert.deepEqual(result, { ok: true, value: { persisted: true } });
    assert.equal(binds, 0);
    assert.equal(inserts, 1);
  });
});
