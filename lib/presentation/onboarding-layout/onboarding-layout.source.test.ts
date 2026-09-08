import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('onboarding layout stack contract', () => {
  it('always renders Stack and only overlays loading UI', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    const renderStart = layout.indexOf('const chrome = resolveOnboardingLayoutChrome');
    const render = layout.slice(renderStart);

    assert.match(layout, /resolveOnboardingLayoutChrome/);
    assert.match(render, /<Stack/);
    assert.match(layout, /styles\.stackHost/);
    assert.match(layout, /collapsable=\{false\}/);
    assert.match(render, /showLoadingOverlay/);
    assert.doesNotMatch(layout, /if \([^)]*access === 'loading'[^)]*\) \{\s*return \(/);
    assert.ok(render.indexOf('<Stack') < render.indexOf('showLoadingOverlay'));
  });

  it('keeps age and consent redirects after the Stack', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    const renderStart = layout.indexOf('const chrome = resolveOnboardingLayoutChrome');
    const render = layout.slice(renderStart);

    assert.match(render, /chrome\.redirect === 'age'/);
    assert.match(render, /routes\.onboardingAgeConfirmation/);
    assert.match(render, /chrome\.redirect === 'consent'/);
    assert.match(render, /routes\.onboardingHealthDataConsent/);
    assert.ok(render.indexOf('<Stack') < render.indexOf("chrome.redirect === 'age'"));
    assert.ok(render.indexOf('<Stack') < render.indexOf("chrome.redirect === 'consent'"));
  });

  it('does not drop step-3 after Health Data Consent submit', () => {
    const consent = source('app/(onboarding)/health-data-consent.tsx');
    const handler = consent.slice(
      consent.indexOf('const handleContinue'),
      consent.indexOf('return (', consent.indexOf('const handleContinue')),
    );

    assert.match(handler, /await savePendingHealthDataConsent/);
    assert.match(handler, /router\.push\(routes\.onboardingStep3\)/);
    assert.doesNotMatch(handler, /persistPendingHealthDataConsentAfterAuth/);
    assert.doesNotMatch(handler, /routes\.root/);
  });
});
