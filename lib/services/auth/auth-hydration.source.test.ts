import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('stale session hydration source contracts', () => {
  it('validates a restored session with supabase.auth.getUser after getSession', () => {
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const factory = source('lib/services/auth/auth.service.factory.ts');
    const provider = source('providers/auth-provider.tsx');

    assert.match(repository, /async getServerUser\(\)/);
    assert.match(repository, /supabase\.auth\.getUser\(\)/);
    assert.match(factory, /hydrateLocalSession/);
    assert.match(factory, /getServerUser/);
    assert.match(factory, /resolveHydratedAuthSession/);
    assert.match(provider, /authService\.hydrateLocalSession\(\)/);
    assert.doesNotMatch(
      provider.slice(provider.indexOf('const syncSession'), provider.indexOf('onAuthStateChange')),
      /authService\.getSession\(\)/,
    );
  });

  it('does not apply auth events until hydration finishes, then keeps onAuthStateChange', () => {
    const provider = source('providers/auth-provider.tsx');
    const listener = provider.slice(
      provider.indexOf('onAuthStateChange'),
      provider.indexOf('void syncSession()'),
    );

    assert.match(listener, /if \(!hydrationComplete\) \{/);
    assert.match(listener, /return;/);
    assert.ok(listener.indexOf('if (!hydrationComplete)') < listener.indexOf("setStatus('authenticated')"));
    assert.match(provider, /supabase\.auth\.onAuthStateChange/);
    assert.match(provider, /event === 'PASSWORD_RECOVERY'/);
    assert.match(provider, /setStatus\('authenticated'\)/);
  });

  it('clears a stale local session via signOut and still supports normal logout', () => {
    const provider = source('providers/auth-provider.tsx');
    const hydrate = provider.slice(
      provider.indexOf('const syncSession'),
      provider.indexOf('onAuthStateChange'),
    );
    const signOut = provider.slice(
      provider.indexOf('const signOut'),
      provider.indexOf('const deleteAccount'),
    );

    assert.match(hydrate, /hydrated\.shouldClearLocalSession/);
    assert.match(hydrate, /authService\.signOut\(\)/);
    assert.match(signOut, /authService\.signOut/);
    assert.match(signOut, /setStatus\('unauthenticated'\)/);
    assert.match(signOut, /setSession\(null\)/);
  });

  it('does not log tokens, emails, passwords, or full user ids', () => {
    const diagnostics = source('lib/services/auth/auth-session-diagnostics.ts');
    const hydrate = source('lib/services/auth/auth.service.factory.ts').slice(
      source('lib/services/auth/auth.service.factory.ts').indexOf('async hydrateLocalSession'),
      source('lib/services/auth/auth.service.factory.ts').indexOf('async signInWithEmail'),
    );

    assert.match(diagnostics, /\[nordyan-auth\]/);
    assert.match(diagnostics, /localSessionPresent/);
    assert.match(diagnostics, /serverUserValidated/);
    assert.match(diagnostics, /staleSessionCleared/);
    assert.match(diagnostics, /errorClass/);
    assert.doesNotMatch(diagnostics, /accessToken|refresh_token|access_token|password|email/);
    assert.doesNotMatch(hydrate, /accessToken|refresh_token|access_token|password|email/);
  });

  it('does not change onboarding, consent screens, the app gate, or NotificationLifecycle', () => {
    const factory = source('lib/services/auth/auth.service.factory.ts');
    const provider = source('providers/auth-provider.tsx');
    const gate = source('lib/onboarding/resolve-app-gate.ts');
    const lifecycle = source('lib/presentation/notifications/NotificationLifecycle.tsx');
    const onboardingConsent = source('app/(onboarding)/health-data-consent.tsx');
    const authenticatedConsent = source('app/authenticated-health-data-consent.tsx');

    assert.doesNotMatch(factory, /resolveAppGate|health-data-consent|NotificationLifecycle/);
    assert.doesNotMatch(gate, /hydrateLocalSession|getServerUser/);
    assert.doesNotMatch(lifecycle, /hydrateLocalSession|getServerUser/);
    assert.doesNotMatch(onboardingConsent, /hydrateLocalSession|getServerUser/);
    assert.doesNotMatch(authenticatedConsent, /hydrateLocalSession|getServerUser/);
    assert.match(provider, /NotificationLifecycle|cancelNordyanScheduledNotifications/);
  });
});
