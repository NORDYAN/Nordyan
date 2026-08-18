import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  assertSignupForensicsPayloadSafe,
  buildSignupForensicsPayload,
} from './signup-forensics';

const baseInput = {
  stage: 'provider-result' as const,
  signupProviderResult: 'provider_error' as const,
  outcome: 'failed' as const,
  pendingBindResult: 'not_attempted' as const,
  persistenceResult: 'not_attempted' as const,
  profileOwnerState: 'unowned' as const,
  lifestyleOwnerState: 'unowned' as const,
};

describe('signup forensics', () => {
  it('keeps only safe provider status and code metadata', () => {
    const payload = buildSignupForensicsPayload({
      ...baseInput,
      providerError: {
        status: 429,
        code: 'over_email_send_rate_limit',
        message: 'sensitive provider message',
      },
    });

    assert.deepEqual(payload, {
      ...baseInput,
      providerStatus: 429,
      providerCode: 'over_email_send_rate_limit',
    });
    assert.equal(JSON.stringify(payload).includes('sensitive provider message'), false);
    assert.doesNotThrow(() => assertSignupForensicsPayloadSafe(payload));
  });

  it('drops malformed provider metadata instead of logging raw values', () => {
    const payload = buildSignupForensicsPayload({
      ...baseInput,
      providerError: {
        status: 999,
        code: 'unsafe code containing an email@example.com',
      },
    });

    assert.equal(payload.providerStatus, null);
    assert.equal(payload.providerCode, null);
  });
});
