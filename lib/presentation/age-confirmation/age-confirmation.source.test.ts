import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('age confirmation source contracts', () => {
  it('sends step-2 into age confirmation before Health Data Consent', () => {
    const step2 = source('app/(onboarding)/step-2.tsx');
    const screen = source('app/(onboarding)/age-confirmation.tsx');
    const routes = source('constants/routes.ts');

    assert.match(step2, /routes\.onboardingAgeConfirmation/);
    assert.doesNotMatch(step2, /routes\.onboardingHealthDataConsent/);
    assert.match(routes, /onboardingAgeConfirmation: '\/\(onboarding\)\/age-confirmation'/);
    assert.match(screen, /useState\(false\)/);
    assert.match(screen, /canSubmitAgeConfirmation\(checked\)/);
    assert.match(screen, /savePendingAgeConfirmation/);
    assert.match(screen, /routes\.onboardingHealthDataConsent/);
  });

  it('guards age-gated onboarding routes before existing consent gating', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    assert.match(layout, /isAgeGatedOnboardingPath/);
    assert.match(layout, /hasPendingAgeConfirmation/);
    assert.match(layout, /routes\.onboardingAgeConfirmation/);
    assert.match(layout, /isHealthOnboardingCollectionPath/);
    assert.match(layout, /routes\.onboardingHealthDataConsent/);
    assert.ok(
      layout.indexOf('isAgeGatedOnboardingPath') < layout.indexOf('isHealthOnboardingCollectionPath'),
    );
    assert.match(layout, /<Stack/);
    assert.match(layout, /resolveOnboardingLayoutChrome/);
    assert.doesNotMatch(layout, /if \([^)]*access === 'loading'[^)]*\) \{\s*return \(/);
  });

  it('rejects under-18 DOB on step-4 and health-profile without rewriting the value', () => {
    const step4 = source('app/(onboarding)/step-4.tsx');
    const health = source('app/(tabs)/profile/health-profile.tsx');
    const calculateStart = step4.indexOf('const handleCalculateProfile');
    const calculateBlock = step4.slice(
      calculateStart,
      step4.indexOf('return (', calculateStart),
    );
    const saveStart = health.indexOf('const handleSave');
    const saveBlock = health.slice(saveStart, health.indexOf('return (', saveStart));

    assert.match(calculateBlock, /isEligibleAdultDateOfBirth/);
    assert.match(calculateBlock, /profile\.validation\.mustBe18/);
    assert.ok(
      calculateBlock.indexOf('isEligibleAdultDateOfBirth') <
        calculateBlock.indexOf('setPendingProfileMeasurements'),
    );
    assert.match(saveBlock, /isEligibleAdultDateOfBirth/);
    assert.match(saveBlock, /profile\.validation\.mustBe18/);
    assert.ok(
      saveBlock.indexOf('isEligibleAdultDateOfBirth') < saveBlock.indexOf('completeOnboarding'),
    );
    assert.doesNotMatch(calculateBlock, /setDateOfBirth\('18/);
    assert.doesNotMatch(saveBlock, /setDateOfBirth\('18/);
  });

  it('does not add a database migration or change Auth, PKCE, consent schema, or Coach', () => {
    const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
    const migrations = fs.readdirSync(migrationsDir);
    assert.equal(
      migrations.some(
        (name) => name.includes('age_confirmation') || name.includes('age_gate'),
      ),
      false,
    );
    for (const name of migrations) {
      const sql = fs.readFileSync(path.join(migrationsDir, name), 'utf8');
      assert.doesNotMatch(sql, /pending_age_confirmation|confirmed18Plus|age_confirmation/);
    }

    const redirect = source('lib/services/auth/auth-redirect.ts');
    const callback = source('app/auth/callback.tsx');
    const recovery = source('app/auth/recovery-callback.tsx');
    const consentMigration = source(
      'supabase/migrations/20260822180000_create_health_data_consents.sql',
    );
    const coach = source('services/coach-language/src/createCoachLanguageApp.ts');

    assert.doesNotMatch(redirect, /age-confirmation|pending_age_confirmation/);
    assert.doesNotMatch(callback, /age-confirmation|pending_age_confirmation/);
    assert.doesNotMatch(recovery, /age-confirmation|pending_age_confirmation/);
    assert.doesNotMatch(consentMigration, /age.confirmation|confirmed18Plus|18\+/);
    assert.doesNotMatch(coach, /age-confirmation|pending_age_confirmation/);
  });
});
