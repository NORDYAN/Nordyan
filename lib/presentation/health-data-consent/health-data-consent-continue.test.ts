import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  decideAuthenticatedHealthDataConsentContinueDestination,
  decideOnboardingHealthDataConsentContinueDestination,
} from './health-data-consent-continue';

describe('health data consent continue destinations', () => {
  it('keeps onboarding consent on lifestyle step-3', () => {
    assert.equal(decideOnboardingHealthDataConsentContinueDestination(), 'step-3');
  });

  it('sends authenticated consent accept to the root gate, never onboarding', () => {
    assert.equal(decideAuthenticatedHealthDataConsentContinueDestination(), 'root');
    assert.notEqual(decideAuthenticatedHealthDataConsentContinueDestination(), 'step-3');
  });
});
