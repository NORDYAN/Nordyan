import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  ONBOARDING_FORENSICS_VERSION,
  assertOnboardingForensicsPayloadSafe,
  buildOnboardingForensicsPayload,
} from './onboarding-forensics';

describe('onboarding forensics v3 payload', () => {
  it('emits version 3 metadata without identity or health fields', () => {
    const payload = buildOnboardingForensicsPayload({
      event: 'step-4-save',
      authenticated: false,
      snapshot: {
        pendingProfileExists: true,
        pendingLifestyleExists: true,
        profileOwnerState: 'bound',
        lifestyleOwnerState: 'bound',
        visibleProfileExists: false,
        visibleLifestyleExists: false,
      },
      profileWriteResult: 'ignored_bound',
      lifestyleWriteResult: 'not_attempted',
      visitIdPresent: false,
      onboardingResultStatus: null,
      unavailableReason: null,
      healthScoreInputReady: null,
    });

    assert.equal(payload.onboardingForensicsVersion, ONBOARDING_FORENSICS_VERSION);
    assert.equal(ONBOARDING_FORENSICS_VERSION, 3);
    assert.equal(payload.event, 'step-4-save');
    assert.equal(payload.authenticated, false);
    assert.equal(payload.profileWriteResult, 'ignored_bound');
    assert.equal(payload.visitIdPresent, false);
    assertOnboardingForensicsPayloadSafe(payload);
    assert.deepEqual(
      Object.keys(payload).sort(),
      [
        'authenticated',
        'event',
        'healthScoreInputReady',
        'lifestyleOwnerState',
        'lifestyleWriteResult',
        'onboardingForensicsVersion',
        'onboardingResultStatus',
        'pendingLifestyleExists',
        'pendingProfileExists',
        'profileOwnerState',
        'profileWriteResult',
        'unavailableReason',
        'visibleLifestyleExists',
        'visibleProfileExists',
        'visitIdPresent',
      ].sort(),
    );
  });
});
