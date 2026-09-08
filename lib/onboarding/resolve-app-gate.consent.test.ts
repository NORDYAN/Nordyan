import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveHealthDataConsentGate } from './resolve-health-data-consent-gate';

describe('resolveHealthDataConsentGate', () => {
  it('gates an authenticated existing user without current consent', async () => {
    const result = await resolveHealthDataConsentGate({
      userId: 'user-1',
      persistPendingConsent: async () => ({ ok: true, value: { persisted: false } }),
      hasActiveCurrentConsent: async () => false,
    });

    assert.equal(result, 'authenticated-health-data-consent');
  });

  it('allows the normal authenticated flow when current-version consent is active', async () => {
    let persisted = 0;
    const result = await resolveHealthDataConsentGate({
      userId: 'user-1',
      persistPendingConsent: async () => {
        persisted += 1;
        return { ok: true, value: { persisted: true } };
      },
      hasActiveCurrentConsent: async () => true,
    });

    assert.equal(persisted, 1);
    assert.equal(result, 'continue');
  });

  it('re-prompts when a new policy version has no active grant', async () => {
    const result = await resolveHealthDataConsentGate({
      userId: 'user-1',
      persistPendingConsent: async () => ({ ok: true, value: { persisted: false } }),
      hasActiveCurrentConsent: async () => false,
    });

    assert.equal(result, 'authenticated-health-data-consent');
  });

  it('persists a pending grant before checking the authoritative row', async () => {
    const events: string[] = [];
    await resolveHealthDataConsentGate({
      userId: 'user-1',
      persistPendingConsent: async () => {
        events.push('persist');
      },
      hasActiveCurrentConsent: async () => {
        events.push('check');
        return true;
      },
    });

    assert.deepEqual(events, ['persist', 'check']);
  });

  it('stays fail-closed on the consent screen when persist fails and the read is inactive', async () => {
    const result = await resolveHealthDataConsentGate({
      userId: 'user-1',
      persistPendingConsent: async () => ({
        ok: false,
        error: { code: 'INTEGRATION', message: 'insert failed' },
      }),
      hasActiveCurrentConsent: async () => false,
    });

    assert.equal(result, 'authenticated-health-data-consent');
  });
});
