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
    assert.match(index, /gate\.destination === 'onboarding'/);
    assert.match(index, /gate\.destination === 'check-email'/);
    assert.match(index, /getPendingSignupVerification/);
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
        saveBlock.indexOf('router.push(routes.onboardingMeasurementChoice)'),
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
});
