import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('onboarding-first auth flow source contracts', () => {
  it('sends unauthenticated cold start to onboarding intro', () => {
    const gate = fs.readFileSync(path.join(process.cwd(), 'lib/onboarding/resolve-app-gate.ts'), 'utf8');
    const unauth = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/resolve-unauthenticated-app-gate.ts'),
      'utf8',
    );
    const index = fs.readFileSync(path.join(process.cwd(), 'app/index.tsx'), 'utf8');
    const unauthBlock = gate.slice(
      gate.indexOf('if (!input.isAuthenticated || !input.userId)'),
      gate.indexOf('const destination = await resolveAuthenticatedOnboardingGate'),
    );

    assert.match(unauthBlock, /resolveUnauthenticatedAppGate/);
    assert.doesNotMatch(unauthBlock, /sign-in/);
    assert.match(unauth, /destination: 'onboarding'/);
    assert.match(unauth, /destination: 'check-email'/);
    assert.doesNotMatch(unauth, /sign-in/);
    assert.match(index, /visibleGate\.destination === 'onboarding'/);
    assert.match(index, /Redirect href=\{routes\.onboarding\}/);
    assert.match(index, /visibleGate\.destination === 'check-email'/);
    assert.match(index, /visibleGate\.destination === 'authenticated-health-data-consent'/);
    assert.match(index, /getPendingSignupVerification/);
    assert.match(index, /setGate\(APP_GATE_LOADING\)/);
    assert.match(index, /applyAppGateIfCurrent/);
    assert.match(index, /visibleAppGate/);
  });

  it('lets sign-up return to the first onboarding screen without looping through Logga in', () => {
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');
    const signIn = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-in.tsx'), 'utf8');
    const sv = fs.readFileSync(path.join(process.cwd(), 'lib/i18n/resources/sv.ts'), 'utf8');
    const nb = fs.readFileSync(path.join(process.cwd(), 'lib/i18n/resources/nb.ts'), 'utf8');

    assert.match(signUp, /alternateHref=\{routes\.onboarding\}/);
    assert.match(signUp, /auth\.signUp\.backToStart/);
    assert.doesNotMatch(signUp, /alternateHref=\{routes\.authSignIn\}/);
    assert.doesNotMatch(signUp, /auth\.signUp\.alternateLabel/);
    assert.match(sv, /'auth\.signUp\.backToStart': '← Tillbaka till start'/);
    assert.match(nb, /'auth\.signUp\.backToStart': '← Tilbake til start'/);

    assert.match(signIn, /alternateHref=\{routes\.onboarding\}/);
    assert.match(signIn, /auth\.signIn\.alternatePrompt/);
    assert.match(signIn, /auth\.signIn\.alternateLabel/);
    assert.doesNotMatch(signIn, /auth\.signUp\.backToStart/);
    assert.doesNotMatch(signIn, /alternateHref=\{routes\.authSignUp\}/);
  });

  it('keeps sign-in submit on existing-user login through root', () => {
    const signIn = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-in.tsx'), 'utf8');
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const signInBlock = provider.slice(
      provider.indexOf('const signInWithEmail'),
      provider.indexOf('const signUpWithEmail'),
    );
    const submit = signIn.slice(
      signIn.indexOf('const handleSubmit'),
      signIn.indexOf('return ('),
    );

    assert.match(submit, /signInWithEmail\(email, password\)/);
    assert.match(submit, /router\.replace\(routes\.root\)/);
    assert.doesNotMatch(submit, /hasRequiredAnonymousSignupBaseline/);
    assert.doesNotMatch(submit, /signUpWithEmail/);
    assert.match(signInBlock, /await clearUnownedPendingOnboardingForExistingSignIn\(\);/);
    assert.doesNotMatch(signInBlock, /bindPendingOnboardingToUser/);
  });

  it('blocks signup until unowned pending Initial Lifestyle exists', () => {
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');
    const helper = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/anonymous-signup-baseline.ts'),
      'utf8',
    );
    const complete = fs.readFileSync(
      path.join(process.cwd(), 'lib/domain/profile/is-profile-complete.ts'),
      'utf8',
    );
    const gate = fs.readFileSync(path.join(process.cwd(), 'lib/onboarding/resolve-app-gate.ts'), 'utf8');
    const authenticatedGate = gate.slice(
      gate.indexOf('export async function resolveAuthenticatedOnboardingGate'),
      gate.indexOf('export async function resolveAppGate'),
    );
    const submit = signUp.slice(
      signUp.indexOf('const handleSubmit'),
      signUp.indexOf('return ('),
    );

    assert.match(signUp, /hasRequiredAnonymousSignupBaseline/);
    assert.match(helper, /getPendingInitialLifestyle/);
    assert.match(helper, /initialLifestyleAnswersValidator/);
    assert.match(helper, /getUnownedPendingInitialLifestyle/);
    assert.match(submit, /await hasRequiredAnonymousSignupBaseline\(\)/);
    assert.ok(
      submit.indexOf('await hasRequiredAnonymousSignupBaseline()') <
        submit.indexOf('await signUpWithEmail(email, password)'),
    );
    assert.match(submit, /router\.replace\(routes\.onboarding\)/);
    assert.ok(
      submit.indexOf('if (!maySignUp)') < submit.indexOf('await signUpWithEmail(email, password)'),
    );
    assert.ok(
      submit.indexOf('router.replace(routes.onboarding)') <
        submit.indexOf('await signUpWithEmail(email, password)'),
    );
    assert.doesNotMatch(complete, /lifestyle|sleepQuality|initialLifestyle/);
    assert.doesNotMatch(authenticatedGate, /initialLifestyle|getPendingInitialLifestyle|hasRequiredAnonymousSignupBaseline/);
  });

  it('sends step-2 into Health Data Consent after product value', () => {
    const step2 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-2.tsx'), 'utf8');
    assert.match(step2, /routes\.onboardingHealthDataConsent/);
    assert.doesNotMatch(step2, /routes\.onboardingAgeConfirmation/);
    assert.doesNotMatch(step2, /routes\.onboardingLifestyleIntro/);
  });

  it('keeps a subordinate Logga in entry on the onboarding intro', () => {
    const intro = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/index.tsx'), 'utf8');
    assert.match(intro, /t\('onboarding\.getStarted'\)/);
    assert.match(intro, /t\('onboarding\.logIn'\)/);
    assert.match(intro, /routes\.authSignIn/);
  });

  it('treats Kom igång as a new anonymous attempt without clearing UUID retries', () => {
    const intro = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/index.tsx'), 'utf8');
    const ownership = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-onboarding-ownership.ts'),
      'utf8',
    );
    const lifestyleHook = fs.readFileSync(
      path.join(process.cwd(), 'lib/hooks/initial-lifestyle/useOnboardingInitialLifestyle.ts'),
      'utf8',
    );
    const startBlock = intro.slice(
      intro.indexOf('const handleGetStarted'),
      intro.indexOf('const handleSignIn'),
    );
    const resetBlock = ownership.slice(
      ownership.indexOf('export async function startNewAnonymousOnboarding'),
      ownership.indexOf('export async function clearCompletedOnboardingLocalData'),
    );

    assert.match(startBlock, /await startNewAnonymousOnboarding\(\)/);
    assert.ok(
      startBlock.indexOf('await startNewAnonymousOnboarding()') <
        startBlock.indexOf('router.push(routes.onboardingStep2)'),
    );
    assert.match(resetBlock, /clearUnownedPendingOnboarding\(ownershipDeps\)/);
    assert.match(resetBlock, /beginNewAnonymousOnboardingAttempt\(\)/);
    assert.match(resetBlock, /clearUnownedPendingHealthDataConsent\(\)/);
    assert.match(resetBlock, /clearUnownedPendingAgeConfirmation\(\)/);
    assert.doesNotMatch(resetBlock, /clearPendingProfileMeasurementsForUser/);
    assert.doesNotMatch(resetBlock, /clearPendingInitialLifestyleForUser/);
    assert.doesNotMatch(resetBlock, /clearPendingSignupVerification/);
    assert.match(lifestyleHook, /getAnonymousOnboardingAttemptVersion/);
    assert.match(lifestyleHook, /setAnswers\(\{\}\)/);
  });

  it('reloads profile prefill whenever step-4 regains focus', () => {
    const step4 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-4.tsx'), 'utf8');
    assert.match(step4, /useFocusEffect/);
    assert.match(step4, /getVisiblePendingProfileMeasurements\(userId\)/);
  });

  it('sends unauthenticated step-5 to sign-up without clearing pending data', () => {
    const step5 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-5.tsx'), 'utf8');
    assert.match(step5, /routes\.authSignUp/);
    assert.doesNotMatch(step5, /routes\.authSignIn/);
    assert.doesNotMatch(step5, /clearUnownedPendingOnboardingForExistingSignIn/);
    assert.doesNotMatch(step5, /clearPendingProfileMeasurements\(/);
  });

  it('binds current-session unowned pending data before authenticated step-5 persist', () => {
    const step5 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-5.tsx'), 'utf8');
    const handler = step5.slice(step5.indexOf('const handleOpenNordyan'), step5.indexOf('return ('));
    assert.match(handler, /bindPendingOnboardingToUser\(session\.user\.id\)/);
    assert.match(handler, /if \(!ownership\.ok\)/);
    assert.match(handler, /syncPendingProfileAfterAuth/);
    assert.match(handler, /persistPendingInitialLifestyleAfterAuth/);
  });

  it('keeps tabs authentication-required and sends unauthenticated users through the root gate', () => {
    const tabs = fs.readFileSync(path.join(process.cwd(), 'app/(tabs)/_layout.tsx'), 'utf8');
    assert.match(tabs, /status === 'unauthenticated'/);
    assert.match(tabs, /routes\.root/);
    assert.doesNotMatch(tabs, /routes\.authSignIn/);
  });

  it('sends logout through the root gate instead of sign-in', () => {
    const profile = fs.readFileSync(path.join(process.cwd(), 'app/(tabs)/profile/index.tsx'), 'utf8');
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const signOutBlock = provider.slice(
      provider.indexOf('const signOut'),
      provider.indexOf('const value = useMemo'),
    );
    const handleSignOut = profile.slice(
      profile.indexOf('const handleSignOut'),
      profile.indexOf('return ('),
    );

    assert.match(handleSignOut, /router\.replace\(routes\.root\)/);
    assert.doesNotMatch(handleSignOut, /routes\.authSignIn/);
    assert.match(signOutBlock, /authService\.signOut/);
    assert.match(signOutBlock, /clearCurrentUserPendingOnboardingLeftover/);
    assert.doesNotMatch(signOutBlock, /clearCompletedOnboardingLocalData/);
    assert.doesNotMatch(signOutBlock, /clearUnownedPendingOnboarding/);
  });

  it('clears completed local onboarding data only after profile and Initial Lifestyle both persist', () => {
    const step5 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-5.tsx'), 'utf8');
    const handler = step5.slice(step5.indexOf('const handleOpenNordyan'), step5.indexOf('return ('));
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const signUpBlock = provider.slice(
      provider.indexOf('const signUpWithEmail'),
      provider.indexOf('const resendSignupVerification'),
    );

    assert.match(handler, /clearCompletedOnboardingLocalData\(session\.user\.id\)/);
    assert.match(
      handler,
      /if \(!lifestyleResult\.ok\) \{[\s\S]*?return;[\s\S]*?\}[\s\S]*?clearCompletedOnboardingLocalData/,
    );
    assert.match(signUpBlock, /if \(profileSync\.ok && lifestyleSync\.ok\)/);
    assert.match(signUpBlock, /clearCompletedOnboardingLocalData\(result\.value\.session\.user\.id\)/);
  });

  it('does not wipe locale, Coach discovery, or other unrelated local settings during cleanup', () => {
    const service = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-onboarding-ownership.service.ts'),
      'utf8',
    );
    const wrapper = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-onboarding-ownership.ts'),
      'utf8',
    );
    assert.doesNotMatch(service, /locale/);
    assert.doesNotMatch(service, /coach_home/);
    assert.doesNotMatch(service, /onboarding_complete/);
    assert.doesNotMatch(wrapper, /locale/);
    assert.doesNotMatch(wrapper, /coach_home/);
    assert.match(wrapper, /clearPendingSignupVerification/);
  });

  it('resets anonymous onboarding profile fields instead of keeping a previous draft', () => {
    const step4 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-4.tsx'), 'utf8');
    const body = fs.readFileSync(
      path.join(process.cwd(), 'app/(onboarding)/body-measurements.tsx'),
      'utf8',
    );
    assert.match(step4, /resolveOnboardingProfileFormPrefill/);
    assert.match(body, /setWaist\(''\)/);
    assert.match(body, /setNeck\(''\)/);
    assert.match(body, /setHip\(''\)/);
  });

  it('keeps anonymous writes independent from per-user retry data', () => {
    const profileStorage = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-profile-storage.ts'),
      'utf8',
    );
    const lifestyleStorage = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-initial-lifestyle-storage.ts'),
      'utf8',
    );
    const resultHook = fs.readFileSync(
      path.join(process.cwd(), 'lib/hooks/onboarding/useOnboardingResult.ts'),
      'utf8',
    );
    assert.doesNotMatch(profileStorage, /releaseStaleCompletedProfileBinding/);
    assert.doesNotMatch(lifestyleStorage, /releaseStaleCompletedLifestyleBinding/);
    assert.match(profileStorage, /pendingProfileStore\.saveUnowned/);
    assert.match(lifestyleStorage, /savePendingInitialLifestyle/);
    assert.match(resultHook, /getVisiblePendingProfileMeasurements\(userId\)/);
    assert.match(resultHook, /visit/);
    assert.match(resultHook, /profileFallback/);
  });

  it('forces a new step-5 visit when skipping or saving body measurements', () => {
    const choice = fs.readFileSync(
      path.join(process.cwd(), 'app/(onboarding)/measurement-choice.tsx'),
      'utf8',
    );
    const body = fs.readFileSync(
      path.join(process.cwd(), 'app/(onboarding)/body-measurements.tsx'),
      'utf8',
    );
    assert.match(choice, /onboardingResultHref\(\)/);
    assert.doesNotMatch(
      choice.slice(choice.indexOf('handleSkipToHealthScore')),
      /routes\.onboardingStep5/,
    );
    assert.match(body, /onboardingResultHref\(\)/);
  });

  it('does not continue from profile when the anonymous draft was not written', () => {
    const step4 = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/step-4.tsx'), 'utf8');
    const saveStart = step4.indexOf('const handleCalculateProfile');
    const saveBlock = step4.slice(saveStart, step4.indexOf('\n  return (', saveStart));

    assert.match(saveBlock, /profileWriteResult !== 'written'/);
    assert.match(saveBlock, /setSaveError/);
    assert.match(saveBlock, /return;/);
    assert.ok(
      saveBlock.indexOf("profileWriteResult !== 'written'") <
        saveBlock.indexOf('router.push(routes.onboardingNotificationSetup)'),
    );
  });

  it('does not store secrets in the verification-wait record', () => {
    const wait = fs.readFileSync(
      path.join(process.cwd(), 'lib/onboarding/pending-signup-verification.ts'),
      'utf8',
    );
    assert.doesNotMatch(wait, /password/i);
    assert.doesNotMatch(wait, /accessToken|refreshToken|jwt/i);
    assert.doesNotMatch(wait, /waistCm|healthScore|weightKg/);
    assert.match(wait, /email/);
    assert.match(wait, /ownerId/);
  });

  it('does not present language flags or a language selector on onboarding or signup', () => {
    const authLayout = fs.readFileSync(
      path.join(process.cwd(), 'components/auth/AuthLayout.tsx'),
      'utf8',
    );
    const authIndex = fs.readFileSync(path.join(process.cwd(), 'components/auth/index.ts'), 'utf8');
    const authTheme = fs.readFileSync(path.join(process.cwd(), 'theme/auth.ts'), 'utf8');
    const intro = fs.readFileSync(path.join(process.cwd(), 'app/(onboarding)/index.tsx'), 'utf8');
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');
    const checkEmail = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/check-email.tsx'), 'utf8');
    const resolveLocale = fs.readFileSync(path.join(process.cwd(), 'lib/i18n/resolve-locale.ts'), 'utf8');

    assert.doesNotMatch(authLayout, /NordicIdentityFlags|NordicFlag/);
    assert.doesNotMatch(authIndex, /NordicIdentityFlags/);
    assert.doesNotMatch(authTheme, /flagsSize|flagsGap|flagsBorderWidth/);
    assert.doesNotMatch(intro, /NordicIdentityFlags|setLocale|LanguagePicker/);
    assert.doesNotMatch(signUp, /NordicIdentityFlags|setLocale|LanguagePicker/);
    assert.doesNotMatch(checkEmail, /NordicIdentityFlags|setLocale|LanguagePicker/);
    assert.match(resolveLocale, /Norwegian Bokmål, generic Norwegian, and Nynorsk all select `nb`/);
    assert.equal(fs.existsSync(path.join(process.cwd(), 'components/auth/NordicIdentityFlags.tsx')), false);
  });
});
