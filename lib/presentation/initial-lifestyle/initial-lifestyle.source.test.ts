import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Initial Lifestyle intro skip path', () => {
  it('has no skip control or skip wiring for new onboarding', () => {
    const intro = source('components/initial-lifestyle/InitialLifestyleIntro.tsx');
    const view = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const hook = source('lib/hooks/initial-lifestyle/useOnboardingInitialLifestyle.ts');
    const step3 = source('app/(onboarding)/step-3.tsx');
    const gate = source('lib/onboarding/resolve-app-gate.ts');
    const complete = source('lib/domain/profile/is-profile-complete.ts');

    assert.match(intro, /introStartCta/);
    assert.doesNotMatch(intro, /onSkip|introSkipCta|lifestyle\.intro\.skip/);
    assert.doesNotMatch(view, /flow\.skip|onSkip/);
    assert.doesNotMatch(hook, /skipOnboardingInitialLifestyle/);
    assert.doesNotMatch(hook, /skip:/);
    assert.match(step3, /router\.push\(routes\.onboardingStep4\)/);
    assert.doesNotMatch(gate, /initialLifestyle|getInitialLifestyle/);
    assert.doesNotMatch(complete, /lifestyle|sleepQuality/);
  });
});
