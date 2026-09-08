import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from '@/lib/domain/health-data-consent';

import {
  decideAuthenticatedConsentSubmitNavigation,
  submitAuthenticatedHealthDataConsent,
} from './submit-authenticated-health-data-consent';

const currentGrant = {
  consentType: HEALTH_DATA_CONSENT_TYPE,
  policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
  grantedAt: '2026-08-26T15:00:00.000Z',
};

describe('decideAuthenticatedConsentSubmitNavigation', () => {
  it('replaces root only after a successful write and active read-back', () => {
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: true, presence: 'active' }),
      'root',
    );
  });

  it('does not navigate when persist fails or read-back is not active', () => {
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: false, presence: 'active' }),
      'stay',
    );
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: true, presence: 'absent' }),
      'stay',
    );
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: true, presence: 'error' }),
      'stay',
    );
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: true, presence: null }),
      'stay',
    );
  });
});

describe('submitAuthenticatedHealthDataConsent', () => {
  it('inserts then requires an active read-back before success', async () => {
    const userIds: string[] = [];
    const result = await submitAuthenticatedHealthDataConsent('user-1', currentGrant, {
      insertGrant: async (userId, grant) => {
        userIds.push(`insert:${userId}`);
        assert.equal(grant.consentType, HEALTH_DATA_CONSENT_TYPE);
        assert.equal(grant.policyVersion, HEALTH_DATA_CONSENT_POLICY_VERSION);
        return { ok: true, value: { inserted: true } };
      },
      inspectActiveCurrentConsent: async (userId) => {
        userIds.push(`select:${userId}`);
        return 'active';
      },
    });

    assert.deepEqual(result, { ok: true, value: { presence: 'active', userId: 'user-1' } });
    assert.deepEqual(userIds, ['insert:user-1', 'select:user-1']);
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({
        writeOk: result.ok,
        presence: result.ok ? result.value.presence : null,
      }),
      'root',
    );
  });

  it('does not treat persist errors as success', async () => {
    let inspected = 0;
    const result = await submitAuthenticatedHealthDataConsent('user-1', currentGrant, {
      insertGrant: async () => ({
        ok: false,
        error: { code: 'INTEGRATION', message: 'row-level security' },
      }),
      inspectActiveCurrentConsent: async () => {
        inspected += 1;
        return 'absent';
      },
    });

    assert.equal(result.ok, false);
    assert.equal(inspected, 0);
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: result.ok, presence: null }),
      'stay',
    );
  });

  it('does not navigate when write succeeds but read-back is absent', async () => {
    const result = await submitAuthenticatedHealthDataConsent('user-1', currentGrant, {
      insertGrant: async () => ({ ok: true, value: { inserted: true } }),
      inspectActiveCurrentConsent: async () => 'absent',
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error('expected failure');
    }
    assert.equal(result.error.message, 'read_back_absent');
    assert.equal(
      decideAuthenticatedConsentSubmitNavigation({ writeOk: false, presence: 'absent' }),
      'stay',
    );
  });

  it('does not navigate when write succeeds but read-back errors', async () => {
    const result = await submitAuthenticatedHealthDataConsent('user-1', currentGrant, {
      insertGrant: async () => ({ ok: true, value: { inserted: true } }),
      inspectActiveCurrentConsent: async () => 'error',
    });

    assert.equal(result.ok, false);
    if (result.ok) {
      throw new Error('expected failure');
    }
    assert.equal(result.error.message, 'read_back_error');
  });

  it('inserts for the session user even when anonymous pending would mismatch', async () => {
    let inserts = 0;
    const result = await submitAuthenticatedHealthDataConsent('user-1', currentGrant, {
      insertGrant: async (userId) => {
        inserts += 1;
        assert.equal(userId, 'user-1');
        return { ok: true, value: { inserted: true } };
      },
      inspectActiveCurrentConsent: async (userId) => {
        assert.equal(userId, 'user-1');
        return 'active';
      },
    });

    assert.equal(result.ok, true);
    assert.equal(inserts, 1);
  });
});
