import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { resolveOnboardingLayoutChrome } from './onboarding-layout-chrome';

describe('onboarding layout chrome', () => {
  it('keeps the Stack mounted while the guard is loading', () => {
    const chrome = resolveOnboardingLayoutChrome({
      requiresAge: true,
      requiresConsent: true,
      access: 'loading',
    });

    assert.equal(chrome.keepStackMounted, true);
    assert.equal(chrome.showLoadingOverlay, true);
    assert.equal(chrome.redirect, null);
  });

  it('redirects to the age gate without replacing the navigator', () => {
    const chrome = resolveOnboardingLayoutChrome({
      requiresAge: true,
      requiresConsent: true,
      access: 'age',
    });

    assert.equal(chrome.keepStackMounted, true);
    assert.equal(chrome.showLoadingOverlay, false);
    assert.equal(chrome.redirect, 'age');
  });

  it('redirects to Health Data Consent without replacing the navigator', () => {
    const chrome = resolveOnboardingLayoutChrome({
      requiresAge: true,
      requiresConsent: true,
      access: 'consent',
    });

    assert.equal(chrome.keepStackMounted, true);
    assert.equal(chrome.showLoadingOverlay, false);
    assert.equal(chrome.redirect, 'consent');
  });

  it('does not treat consent denial as an age redirect', () => {
    const chrome = resolveOnboardingLayoutChrome({
      requiresAge: false,
      requiresConsent: true,
      access: 'consent',
    });

    assert.equal(chrome.redirect, 'consent');
    assert.equal(chrome.keepStackMounted, true);
  });

  it('allows a guarded collection route once access is allow', () => {
    const chrome = resolveOnboardingLayoutChrome({
      requiresAge: true,
      requiresConsent: true,
      access: 'allow',
    });

    assert.equal(chrome.keepStackMounted, true);
    assert.equal(chrome.showLoadingOverlay, false);
    assert.equal(chrome.redirect, null);
  });
});
