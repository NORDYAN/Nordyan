import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('health data consent source contracts', () => {
  it('inserts the onboarding consent screen between age confirmation and step-3', () => {
    const step2 = source('app/(onboarding)/step-2.tsx');
    const age = source('app/(onboarding)/age-confirmation.tsx');
    const screen = source('app/(onboarding)/health-data-consent.tsx');
    const routes = source('constants/routes.ts');

    assert.match(step2, /routes\.onboardingAgeConfirmation/);
    assert.doesNotMatch(step2, /routes\.onboardingHealthDataConsent/);
    assert.match(age, /routes\.onboardingHealthDataConsent/);
    assert.doesNotMatch(step2, /routes\.onboardingLifestyleIntro/);
    assert.match(routes, /onboardingHealthDataConsent: '\/\(onboarding\)\/health-data-consent'/);
    assert.match(screen, /createCurrentHealthDataConsentGrant/);
    assert.match(screen, /savePendingHealthDataConsent/);
    assert.match(screen, /routes\.onboardingStep3/);
    assert.match(screen, /router\.push\(routes\.onboardingStep3\)/);
    assert.doesNotMatch(screen, /persistPendingHealthDataConsentAfterAuth/);
    assert.doesNotMatch(screen, /routes\.root/);
    assert.doesNotMatch(screen, /onboardingStep2|age-confirmation/);
    assert.match(screen, /HealthDataConsentView/);
    assert.doesNotMatch(screen, /withdrawn|Account Deletion|radera konto/i);
  });

  it('keeps authenticated current-consent enforcement outside the onboarding stack', () => {
    const routes = source('constants/routes.ts');
    const index = source('app/index.tsx');
    const tabs = source('app/(tabs)/_layout.tsx');
    const rootLayout = source('app/_layout.tsx');
    const screen = source('app/authenticated-health-data-consent.tsx');
    const gate = source('lib/onboarding/resolve-app-gate.ts');

    assert.match(routes, /authenticatedHealthDataConsent: '\/authenticated-health-data-consent'/);
    assert.match(rootLayout, /name="authenticated-health-data-consent"/);
    assert.match(index, /visibleGate\.destination === 'authenticated-health-data-consent'/);
    assert.match(index, /routes\.authenticatedHealthDataConsent/);
    assert.doesNotMatch(index, /routes\.onboardingHealthDataConsent/);
    assert.match(tabs, /routes\.authenticatedHealthDataConsent/);
    assert.doesNotMatch(tabs, /routes\.onboardingHealthDataConsent/);
    assert.match(gate, /destination: 'authenticated-health-data-consent'/);
    assert.doesNotMatch(gate, /destination: 'health-data-consent'/);
    assert.match(screen, /submitAuthenticatedHealthDataConsentRuntime/);
    assert.match(screen, /decideAuthenticatedConsentSubmitNavigation/);
    assert.match(screen, /router\.replace\(routes\.root\)/);
    assert.doesNotMatch(screen, /persistPendingHealthDataConsentAfterAuth/);
    assert.doesNotMatch(screen, /onboardingStep3|onboardingStep2|onboardingAgeConfirmation/);
    assert.match(screen, /Redirect href=\{routes\.root\}/);
  });

  it('guards health onboarding collection without editing locked step-3 visuals', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    const step3 = source('app/(onboarding)/step-3.tsx');
    assert.match(layout, /isHealthOnboardingCollectionPath/);
    assert.match(layout, /routes\.onboardingHealthDataConsent/);
    assert.match(layout, /<Stack/);
    assert.match(step3, /InitialLifestyleView/);
    assert.doesNotMatch(step3, /health-data-consent|HEALTH_DATA_CONSENT/);
  });

  it('persists pending consent from the app gate, not signup or PKCE callbacks', () => {
    const gate = source('lib/onboarding/resolve-app-gate.ts');
    const index = source('app/index.tsx');
    const provider = source('providers/auth-provider.tsx');
    const callback = source('app/auth/callback.tsx');
    const redirect = source('lib/services/auth/auth-redirect.ts');
    const recovery = source('app/auth/recovery-callback.tsx');

    assert.match(gate, /persistPendingConsent/);
    assert.match(gate, /resolveHealthDataConsentGate/);
    assert.match(gate, /destination: 'authenticated-health-data-consent'/);
    assert.doesNotMatch(gate, /persistPendingHealthDataConsentAfterAuth/);
    assert.match(index, /persistPendingHealthDataConsentAfterAuth/);
    assert.match(index, /hasActiveCurrentConsent/);
    assert.doesNotMatch(provider, /persistPendingHealthDataConsentAfterAuth/);
    assert.doesNotMatch(callback, /health_data_consent|persistPendingHealthDataConsent/);
    assert.doesNotMatch(redirect, /health_data_consent|HEALTH_DATA_CONSENT/);
    assert.doesNotMatch(recovery, /health_data_consent|persistPendingHealthDataConsent/);
  });

  it('keeps RLS user isolation and cascades consent rows from auth.users', () => {
    const migration = source('supabase/migrations/20260822180000_create_health_data_consents.sql');
    assert.match(migration, /create table if not exists public\.health_data_consents/);
    assert.match(migration, /references auth\.users \(id\) on delete cascade/);
    assert.match(migration, /consent_type = 'health_lifestyle_processing'/);
    assert.match(migration, /withdrawn_at is null or withdrawn_at >= granted_at/);
    assert.match(migration, /health_data_consents_active_unique/);
    assert.match(migration, /where withdrawn_at is null/);
    assert.match(migration, /enable row level security/);
    assert.match(migration, /using \(auth\.uid\(\) = user_id\)/);
    assert.match(migration, /with check \(auth\.uid\(\) = user_id\)/);
    assert.match(migration, /revoke all on table public\.health_data_consents from anon/);
    assert.doesNotMatch(migration, /insert into public\.health_data_consents/);
  });

  it('does not change NotificationLifecycle in this consent-submit pass', () => {
    const lifecycle = source('lib/presentation/notifications/NotificationLifecycle.tsx');
    assert.match(lifecycle, /resolveAppGate/);
    assert.match(lifecycle, /mayOpenHomeForGateDestination/);
    assert.doesNotMatch(lifecycle, /submitAuthenticatedHealthDataConsent/);
  });

  it('does not change Auth, recovery, account deletion, or coach-language', () => {
    const accountDelete = source('lib/services/account-delete/delete-current-account.ts');
    const coach = source('services/coach-language/src/createCoachLanguageApp.ts');
    assert.doesNotMatch(accountDelete, /health_data_consents/);
    assert.doesNotMatch(coach, /health_data_consents|HEALTH_DATA_CONSENT/);
  });
});
