import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('A1 legal + 18+ + progress source contracts', () => {
  it('sends step-2 to health-data-consent and keeps age-confirmation as a redirect', () => {
    const step2 = source('app/(onboarding)/step-2.tsx');
    const age = source('app/(onboarding)/age-confirmation.tsx');
    const consent = source('app/(onboarding)/health-data-consent.tsx');

    assert.match(step2, /routes\.onboardingHealthDataConsent/);
    assert.doesNotMatch(step2, /routes\.onboardingAgeConfirmation/);
    assert.match(age, /Redirect href=\{routes\.onboardingHealthDataConsent\}/);
    assert.doesNotMatch(age, /savePendingAgeConfirmation/);
    assert.doesNotMatch(age, /canSubmitAgeConfirmation/);
    assert.match(consent, /savePendingHealthDataConsent/);
    assert.match(consent, /savePendingAgeConfirmation/);
    assert.ok(
      consent.indexOf('savePendingHealthDataConsent') < consent.indexOf('savePendingAgeConfirmation'),
    );
    assert.ok(
      consent.indexOf('savePendingAgeConfirmation') < consent.indexOf('routes.onboardingStep3'),
    );
    assert.match(consent, /showLegalAgeAcceptance/);
  });

  it('does not age-gate health-data-consent in the onboarding layout', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    const presentation = source(
      'lib/presentation/age-confirmation/age-confirmation.presentation.ts',
    );
    const ageFn = presentation.slice(presentation.indexOf('export function isAgeGatedOnboardingPath'));

    assert.match(layout, /chrome\.redirect === 'age'/);
    assert.match(layout, /Redirect href=\{routes\.onboardingHealthDataConsent\}/);
    assert.doesNotMatch(layout, /Redirect href=\{routes\.onboardingAgeConfirmation\}/);
    assert.match(ageFn, /pathname\.includes\('step-3'\)/);
    assert.doesNotMatch(ageFn, /health-data-consent/);
  });

  it('opens legal documents in-app from the consent view', () => {
    const view = source('components/health-data-consent/HealthDataConsentView.tsx');
    const modal = source('components/legal/LegalDocumentModal.tsx');
    const baseline = source('lib/onboarding/anonymous-signup-baseline.ts');

    assert.match(view, /LegalDocumentModal/);
    assert.doesNotMatch(view, /Linking\.openURL/);
    assert.match(modal, /from 'react-native-webview'/);
    assert.match(modal, /isAllowedLegalNavigationUrl/);
    assert.match(modal, /OnboardingInfoModalShell/);
    assert.match(baseline, /hasPendingAgeConfirmation/);
  });

  it('renders one combined onboarding checkbox and keeps authenticated consent separate', () => {
    const view = source('components/health-data-consent/HealthDataConsentView.tsx');
    const onboarding = source('app/(onboarding)/health-data-consent.tsx');
    const authenticated = source('app/authenticated-health-data-consent.tsx');
    const copy = source('lib/i18n/resources/sv.ts');
    const legalOnboarding = view.slice(
      view.indexOf('{requireLegalAge ? ('),
      view.indexOf(') : ('),
    );
    const authenticatedBranch = view.slice(view.indexOf(') : (') + 5);

    assert.equal((legalOnboarding.match(/accessibilityRole="checkbox"/g) ?? []).length, 1);
    assert.match(legalOnboarding, /openLegalDocument\('terms'\)/);
    assert.match(legalOnboarding, /openLegalDocument\('privacy'\)/);
    assert.doesNotMatch(legalOnboarding, /copy\.checkbox/);
    assert.match(authenticatedBranch, /copy\.checkbox/);
    assert.match(authenticatedBranch, /copy\.policyLink/);
    assert.match(view, /canSubmitOnboardingHealthDataConsent\(accepted\)/);
    assert.match(onboarding, /showLegalAgeAcceptance/);
    assert.doesNotMatch(authenticated, /showLegalAgeAcceptance/);
    assert.match(copy, /samtycker till behandling av mina hälsodata/);
    assert.match(copy, /bekräftar att jag är 18 år eller äldre/);
  });

  it('shows required major progress and keeps optional measurements on profile step', () => {
    const step2 = source('app/(onboarding)/step-2.tsx');
    const choice = source('app/(onboarding)/measurement-choice.tsx');
    const body = source('app/(onboarding)/body-measurements.tsx');
    const lifestyle = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const question = source('components/initial-lifestyle/InitialLifestyleQuestion.tsx');
    const signUp = source('app/(auth)/sign-up.tsx');
    const signIn = source('app/(auth)/sign-in.tsx');

    assert.match(step2, /OnboardingMajorProgress step="product-value"/);
    assert.match(choice, /OnboardingMajorProgress step="profile"/);
    assert.match(body, /OnboardingMajorProgress step="profile"/);
    assert.match(lifestyle, /OnboardingMajorProgress step="lifestyle"/);
    assert.match(question, /formatInitialLifestyleProgress/);
    assert.match(signUp, /progressStep="account"/);
    assert.doesNotMatch(signIn, /progressStep/);
  });
});
