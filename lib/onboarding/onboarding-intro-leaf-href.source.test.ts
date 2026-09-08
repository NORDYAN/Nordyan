import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { routes } from '@/constants/routes';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('onboarding intro leaf href', () => {
  it('uses the Expo Router 6 canonical intro leaf, not the bare group', () => {
    assert.equal(routes.onboarding, '/(onboarding)/');
    assert.notEqual(routes.onboarding, '/(onboarding)');
    assert.notEqual(routes.onboarding, '/(onboarding)/index');

    const routeSource = source('constants/routes.ts');
    assert.match(routeSource, /onboarding:\s*'\/\(onboarding\)\/'/);
    assert.doesNotMatch(routeSource, /onboarding:\s*'\/\(onboarding\)'(?!\/)/);
    assert.doesNotMatch(routeSource, /onboarding:\s*'\/\(onboarding\)\/index'/);
  });

  it('sends unauthenticated cold start Redirects to the intro leaf', () => {
    const index = source('app/index.tsx');
    const redirects = index.match(/Redirect href=\{routes\.onboarding\}/g) ?? [];
    assert.equal(redirects.length, 2);
    assert.doesNotMatch(index, /href=\{['"]\/\(onboarding\)['"]\}/);
    assert.doesNotMatch(index, /href=\{['"]\/\(onboarding\)\/index['"]\}/);
    assert.match(index, /visibleGate\.destination === 'onboarding'/);
  });

  it('keeps Kom igång on the intro leaf pushing step-2', () => {
    const intro = source('app/(onboarding)/index.tsx');
    const startBlock = intro.slice(
      intro.indexOf('const handleGetStarted'),
      intro.indexOf('const handleSignIn'),
    );
    assert.match(startBlock, /router\.push\(routes\.onboardingStep2\)/);
    assert.doesNotMatch(startBlock, /routes\.onboardingAgeConfirmation/);
    assert.equal(routes.onboardingStep2, '/(onboarding)/step-2');
  });

  it('does not send authenticated users to the intro leaf', () => {
    const gate = source('lib/onboarding/resolve-app-gate.ts');
    const authenticated = gate.slice(gate.indexOf('export async function resolveAuthenticatedOnboardingGate'));
    assert.match(authenticated, /return 'home'/);
    assert.match(authenticated, /return 'onboarding-step-4'/);
    assert.doesNotMatch(
      authenticated.slice(0, authenticated.indexOf('export async function resolveAppGate')),
      /return 'onboarding'(?!-)/,
    );

    const tabs = source('app/(tabs)/_layout.tsx');
    assert.match(tabs, /Redirect href=\{routes\.onboardingStep4\}/);
    assert.match(tabs, /destination === 'home' \? 'allowed'/);
  });
});
