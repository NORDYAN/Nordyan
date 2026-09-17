import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveOnboardingActivatePermission } from './resolve-onboarding-activate-permission';

describe('resolveOnboardingActivatePermission', () => {
  it('stores enabled when permission is already granted without requesting again', async () => {
    let requested = 0;
    const choice = await resolveOnboardingActivatePermission({
      getState: async () => 'granted',
      request: async () => {
        requested += 1;
        return 'granted';
      },
    });
    assert.equal(choice, 'enabled');
    assert.equal(requested, 0);
  });

  it('requests only when undetermined and enables only if granted', async () => {
    const granted = await resolveOnboardingActivatePermission({
      getState: async () => 'undetermined',
      request: async () => 'granted',
    });
    const denied = await resolveOnboardingActivatePermission({
      getState: async () => 'undetermined',
      request: async () => 'denied',
    });
    assert.equal(granted, 'enabled');
    assert.equal(denied, 'skipped');
  });

  it('does not enable when denied or unsupported', async () => {
    const denied = await resolveOnboardingActivatePermission({
      getState: async () => 'denied',
      request: async () => 'granted',
    });
    const unsupported = await resolveOnboardingActivatePermission({
      getState: async () => 'unsupported',
      request: async () => 'granted',
    });
    assert.equal(denied, 'skipped');
    assert.equal(unsupported, 'skipped');
  });
});
