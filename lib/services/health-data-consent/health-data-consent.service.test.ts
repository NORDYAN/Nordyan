import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  HEALTH_DATA_CONSENT_POLICY_VERSION,
  HEALTH_DATA_CONSENT_TYPE,
} from '@/lib/domain/health-data-consent';
import { DefaultHealthDataConsentService } from '@/lib/services/health-data-consent/health-data-consent.service';
import type { HealthDataConsentRepository } from '@/lib/repositories/health-data-consent.repository';

const currentGrant = {
  consentType: HEALTH_DATA_CONSENT_TYPE,
  policyVersion: HEALTH_DATA_CONSENT_POLICY_VERSION,
  grantedAt: '2026-08-26T12:00:00.000Z',
};

describe('DefaultHealthDataConsentService', () => {
  it('treats only an active current grant as consent and keeps errors fail-closed', async () => {
    const errorRepo: HealthDataConsentRepository = {
      hasActiveCurrentConsent: async () => ({
        ok: false,
        error: { code: 'INTEGRATION', message: 'network' },
      }),
      insertGrant: async () => ({ ok: true, value: { inserted: false } }),
    };
    const errorService = new DefaultHealthDataConsentService(errorRepo);
    assert.equal(await errorService.inspectActiveCurrentConsent('user-1'), 'error');
    assert.equal(await errorService.hasActiveCurrentConsent('user-1'), false);

    const absentRepo: HealthDataConsentRepository = {
      hasActiveCurrentConsent: async () => ({ ok: true, value: false }),
      insertGrant: async () => ({ ok: true, value: { inserted: false } }),
    };
    const absentService = new DefaultHealthDataConsentService(absentRepo);
    assert.equal(await absentService.inspectActiveCurrentConsent('user-1'), 'absent');
    assert.equal(await absentService.hasActiveCurrentConsent('user-1'), false);

    const activeRepo: HealthDataConsentRepository = {
      hasActiveCurrentConsent: async () => ({ ok: true, value: true }),
      insertGrant: async () => ({ ok: true, value: { inserted: false } }),
    };
    const activeService = new DefaultHealthDataConsentService(activeRepo);
    assert.equal(await activeService.inspectActiveCurrentConsent('user-1'), 'active');
    assert.equal(await activeService.hasActiveCurrentConsent('user-1'), true);
  });

  it('returns active consent on the subsequent read after a successful accept insert', async () => {
    let stored = false;
    const repo: HealthDataConsentRepository = {
      hasActiveCurrentConsent: async () => ({ ok: true, value: stored }),
      insertGrant: async (_userId, grant) => {
        assert.equal(grant.consentType, HEALTH_DATA_CONSENT_TYPE);
        assert.equal(grant.policyVersion, HEALTH_DATA_CONSENT_POLICY_VERSION);
        stored = true;
        return { ok: true, value: { inserted: true } };
      },
    };
    const service = new DefaultHealthDataConsentService(repo);

    assert.equal(await service.hasActiveCurrentConsent('user-1'), false);
    const inserted = await service.insertGrant('user-1', currentGrant);
    assert.deepEqual(inserted, { ok: true, value: { inserted: true } });
    assert.equal(await service.inspectActiveCurrentConsent('user-1'), 'active');
    assert.equal(await service.hasActiveCurrentConsent('user-1'), true);
  });
});
