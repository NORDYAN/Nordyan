import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { routes } from '@/constants/routes';

import {
  assertNordyanNavTraceSafe,
  inspectOnboardingHref,
  type NordyanNavTrace,
} from './nordyan-nav-dev';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('nordyan-nav DEV onboarding trace', () => {
  it('proves the compiled route constant is the trailing-slash intro leaf', () => {
    assert.equal(routes.onboarding, '/(onboarding)/');
    assert.equal(JSON.stringify(routes.onboarding), '"/(onboarding)/"');
  });

  it('shows Expo remaining path and REPLACE screen name for each candidate href', () => {
    assert.deepEqual(inspectOnboardingHref('/(onboarding)'), {
      href: '/(onboarding)',
      hrefJson: '"/(onboarding)"',
      expoRemaining: '(onboarding)/',
      predictedReplaceName: '(onboarding)',
    });
    assert.deepEqual(inspectOnboardingHref('/(onboarding)/'), {
      href: '/(onboarding)/',
      hrefJson: '"/(onboarding)/"',
      expoRemaining: '(onboarding)/',
      predictedReplaceName: '(onboarding)',
    });
    assert.deepEqual(inspectOnboardingHref('/(onboarding)/index'), {
      href: '/(onboarding)/index',
      hrefJson: '"/(onboarding)/index"',
      expoRemaining: '(onboarding)/index/',
      predictedReplaceName: '(onboarding)',
    });
    assert.equal(
      inspectOnboardingHref('/(onboarding)').expoRemaining,
      inspectOnboardingHref('/(onboarding)/').expoRemaining,
    );
  });

  it('logs only the allowlisted fields and never identity keys', () => {
    const payload: NordyanNavTrace = {
      source: 'app/index.tsx',
      href: '/(onboarding)/',
      hrefJson: '"/(onboarding)/"',
      gateDestination: 'onboarding',
      pathname: '/',
      expoRemaining: '(onboarding)/',
      predictedReplaceName: '(onboarding)',
    };
    assertNordyanNavTraceSafe(payload);
    assert.deepEqual(Object.keys(payload).sort(), [
      'expoRemaining',
      'gateDestination',
      'href',
      'hrefJson',
      'pathname',
      'predictedReplaceName',
      'source',
    ]);
  });

  it('is DEV-only and is called immediately before onboarding Redirects', () => {
    const helper = source('lib/onboarding/nordyan-nav-dev.ts');
    const index = source('app/index.tsx');
    const tabs = source('app/(tabs)/_layout.tsx');
    const gate = source('lib/onboarding/resolve-app-gate.ts');
    const unauth = source('lib/onboarding/resolve-unauthenticated-app-gate.ts');

    assert.match(helper, /if \(!__DEV__\)/);
    assert.match(helper, /console\.log\('\[nordyan-nav\]'/);
    assert.match(index, /logNordyanOnboardingRedirect/);
    assert.match(tabs, /logNordyanOnboardingRedirect/);
    assert.match(index, /source: 'app\/index\.tsx'/);
    assert.match(tabs, /source: 'app\/\(tabs\)\/_layout\.tsx'/);
    assert.doesNotMatch(gate, /router\.|Redirect|expo-router/);
    assert.doesNotMatch(unauth, /router\.|Redirect|expo-router/);
  });
});
