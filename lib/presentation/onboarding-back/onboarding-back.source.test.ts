import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('A3B visible onboarding Back', () => {
  it('puts a shared router.back() control on the approved onboarding screens', () => {
    const back = source('components/onboarding/OnboardingBackButton.tsx');
    const step2 = source('app/(onboarding)/step-2.tsx');
    const consentView = source('components/health-data-consent/HealthDataConsentView.tsx');
    const consentScreen = source('app/(onboarding)/health-data-consent.tsx');
    const lifestyle = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const profile = source('app/(onboarding)/step-4.tsx');
    const notifications = source('app/(onboarding)/notification-setup.tsx');
    const choice = source('app/(onboarding)/measurement-choice.tsx');
    const body = source('app/(onboarding)/body-measurements.tsx');

    assert.match(back, /name="chevron-back"/);
    assert.match(back, /t\('common\.back'\)/);
    assert.match(back, /backHitSlop/);
    assert.match(back, /onPress \?\? \(\(\) => router\.back\(\)\)/);
    assert.match(back, /<OnboardingBackButton \/>/);
    assert.doesNotMatch(back, /savePending|setPending|updatePending|draft/);

    assert.match(step2, /OnboardingBackHeader step="product-value"/);
    assert.match(consentView, /OnboardingBackHeader step=\{props\.progressStep\}/);
    assert.match(consentScreen, /progressStep="legal"/);
    assert.match(lifestyle, /isIntro \? \(\s*<OnboardingBackHeader step="lifestyle"/);
    assert.match(profile, /OnboardingBackHeader step="profile"/);
    assert.match(notifications, /OnboardingBackHeader step="profile"/);
    assert.match(choice, /OnboardingBackHeader step="profile"/);
    assert.match(body, /OnboardingBackHeader step="profile"/);
  });

  it('does not add visible Back to intro, lifestyle questions, result, or auth screens', () => {
    const intro = source('app/(onboarding)/index.tsx');
    const question = source('components/initial-lifestyle/InitialLifestyleQuestion.tsx');
    const lifestyle = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const result = source('app/(onboarding)/step-5.tsx');
    const signUp = source('app/(auth)/sign-up.tsx');
    const checkEmail = source('app/(auth)/check-email.tsx');
    const authLayout = source('components/auth/AuthLayout.tsx');
    const authenticatedConsent = source('app/authenticated-health-data-consent.tsx');

    assert.doesNotMatch(intro, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.doesNotMatch(question, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.match(
      lifestyle,
      /isIntro \? \(\s*<OnboardingBackHeader step="lifestyle" \/>\s*\) : \(\s*<OnboardingMajorProgress step="lifestyle" \/>/,
    );
    assert.doesNotMatch(result, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.match(result, /OnboardingMajorProgress step="result"/);
    assert.doesNotMatch(signUp, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.doesNotMatch(checkEmail, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.doesNotMatch(authLayout, /OnboardingBackHeader|OnboardingBackButton|router\.back\(/);
    assert.doesNotMatch(authenticatedConsent, /OnboardingBackHeader|progressStep/);
    assert.match(signUp, /auth\.signUp\.backToStart/);
    assert.match(checkEmail, /onUseAnotherEmail/);
  });

  it('keeps lifestyle question Back as previous-question retreat, not route back', () => {
    const question = source('components/initial-lifestyle/InitialLifestyleQuestion.tsx');
    const lifestyle = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const hook = source('lib/hooks/initial-lifestyle/useOnboardingInitialLifestyle.ts');

    assert.match(lifestyle, /onBack=\{flow\.goBack\}/);
    assert.match(question, /onPress=\{onBack\}/);
    assert.match(question, /name="chevron-back"/);
    assert.match(hook, /setStep\(\(current\) => retreatInitialLifestyleStep\(current\)\)/);
    assert.doesNotMatch(question, /router\.back\(/);
    assert.doesNotMatch(hook, /router\.back\(/);
  });

  it('documents the known lifestyle gesture inconsistency without changing it', () => {
    const layout = source('app/(onboarding)/_layout.tsx');
    const step3 = source('app/(onboarding)/step-3.tsx');
    const lifestyle = source('components/initial-lifestyle/InitialLifestyleView.tsx');
    const hook = source('lib/hooks/initial-lifestyle/useOnboardingInitialLifestyle.ts');

    assert.match(layout, /screenOptions=\{\{ headerShown: false \}\}/);
    assert.doesNotMatch(layout, /gestureEnabled/);
    assert.doesNotMatch(step3, /gestureEnabled/);
    assert.doesNotMatch(lifestyle, /gestureEnabled/);
    assert.match(hook, /retreatInitialLifestyleStep/);
    assert.doesNotMatch(hook, /router\.(back|replace|push)/);
  });

  it('does not persist profile, lifestyle, or measurement state from Back', () => {
    const back = source('components/onboarding/OnboardingBackButton.tsx');
    const profile = source('app/(onboarding)/step-4.tsx');
    const body = source('app/(onboarding)/body-measurements.tsx');
    const consentScreen = source('app/(onboarding)/health-data-consent.tsx');
    const consentView = source('components/health-data-consent/HealthDataConsentView.tsx');
    const hook = source('lib/hooks/initial-lifestyle/useOnboardingInitialLifestyle.ts');

    const profileContinue = profile.slice(
      profile.indexOf('const handleCalculateProfile'),
      profile.indexOf('return (', profile.indexOf('const handleCalculateProfile')),
    );
    const bodyContinue = body.slice(
      body.indexOf('const handleContinue'),
      body.indexOf('const handleSkipLater'),
    );
    const consentContinue = consentScreen.slice(
      consentScreen.indexOf('const handleContinue'),
      consentScreen.indexOf('return ('),
    );
    const lifestyleComplete = hook.slice(
      hook.indexOf('const complete = useCallback'),
      hook.indexOf('return {'),
    );
    const profileRender = profile.slice(profile.lastIndexOf('return ('));
    const bodyRender = body.slice(body.lastIndexOf('return ('));
    const lifestyleGoBack = hook.slice(
      hook.indexOf('const goBack = useCallback'),
      hook.indexOf('const goNext = useCallback'),
    );

    assert.doesNotMatch(back, /pending|savePending|setPending|updatePending|AsyncStorage/);
    assert.match(profileContinue, /setPendingProfileMeasurements/);
    assert.match(bodyContinue, /updatePendingProfileMeasurements/);
    assert.match(consentContinue, /savePendingHealthDataConsent/);
    assert.match(lifestyleComplete, /savePendingOnboardingInitialLifestyle/);
    assert.doesNotMatch(lifestyleGoBack, /savePending|pendingStore/);
    assert.doesNotMatch(profileRender, /setPendingProfileMeasurements/);
    assert.doesNotMatch(bodyRender, /updatePendingProfileMeasurements/);
    assert.doesNotMatch(consentView, /savePendingHealthDataConsent|savePendingAgeConfirmation/);
  });

  it('keeps A1 progress values and legal modal close behavior unchanged', () => {
    const progress = source('lib/presentation/onboarding-progress/onboarding-progress.ts');
    const modal = source('components/legal/LegalDocumentModal.tsx');
    const consentView = source('components/health-data-consent/HealthDataConsentView.tsx');
    const help = source('components/onboarding/ActivityHelpModal.tsx');

    assert.match(progress, /'product-value': 1/);
    assert.match(progress, /legal: 2/);
    assert.match(progress, /lifestyle: 3/);
    assert.match(progress, /profile: 4/);
    assert.match(progress, /result: 5/);
    assert.match(progress, /account: 6/);
    assert.match(progress, /onboardingMajorStepForOptionalMeasurements/);
    assert.match(modal, /onClose=\{handleClose\}/);
    assert.match(modal, /t\('common\.close'\)/);
    assert.doesNotMatch(modal, /router\.back\(/);
    assert.match(consentView, /LegalDocumentModal/);
    assert.match(consentView, /onClose=\{\(\) => setLegalDocument\(null\)\}/);
    assert.match(help, /OnboardingInfoModalShell/);
  });
});
