import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

describe('auth verification source contracts', () => {
  it('uses PKCE and the same emailRedirectTo for signup and resend', () => {
    const client = fs.readFileSync(path.join(process.cwd(), 'lib/supabase/client.ts'), 'utf8');
    const repository = fs.readFileSync(
      path.join(process.cwd(), 'lib/repositories/supabase-auth.repository.ts'),
      'utf8',
    );

    assert.match(client, /flowType:\s*'pkce'/);
    assert.equal((repository.match(/emailRedirectTo:\s*getAuthEmailRedirectTo\(\)/g) ?? []).length, 2);

    const redirect = fs.readFileSync(
      path.join(process.cwd(), 'lib/services/auth/auth-redirect.ts'),
      'utf8',
    );
    assert.match(redirect, /EMAIL_VERIFICATION_WEB_REDIRECT = `https:\/\/nordyan\.app\$\{AUTH_CALLBACK_PATH\}`/);
    assert.match(redirect, /getAuthEmailRedirectTo\(\):\s*string \{\s*return EMAIL_VERIFICATION_WEB_REDIRECT;/);
    assert.match(redirect, /PASSWORD_RECOVERY_REDIRECT = `nordyan:\/\/\$\{PASSWORD_RECOVERY_CALLBACK_PATH/);
    assert.doesNotMatch(
      redirect,
      /getPasswordRecoveryRedirectTo\(\)[\s\S]*EMAIL_VERIFICATION_WEB_REDIRECT/,
    );
  });

  it('does not log callback URLs or tokens', () => {
    const files = [
      'app/auth/callback.tsx',
      'lib/presentation/auth-verification/complete-auth-email-callback.ts',
      'lib/repositories/supabase-auth.repository.ts',
      'lib/services/auth/auth.service.ts',
      'providers/auth-provider.tsx',
    ];

    for (const relativePath of files) {
      const source = fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
      assert.doesNotMatch(source, /console\.(log|info|debug)/);
      assert.doesNotMatch(source, /JSON\.stringify\(params\)/);
    }

    const callback = fs.readFileSync(path.join(process.cwd(), 'app/auth/callback.tsx'), 'utf8');
    assert.doesNotMatch(callback, /access_token|refresh_token/);
  });

  it('routes verified users through the root gate', () => {
    const callback = fs.readFileSync(path.join(process.cwd(), 'app/auth/callback.tsx'), 'utf8');
    assert.match(callback, /router\.replace\(routes\.root\)/);
    assert.doesNotMatch(callback, /routes\.home/);
    assert.match(callback, /clearCompletedOnboardingLocalData/);
    assert.doesNotMatch(callback, /clearPendingSignupVerification/);
  });

  it('waits for actionable callback params before locking the one-shot start', () => {
    const callback = fs.readFileSync(path.join(process.cwd(), 'app/auth/callback.tsx'), 'utf8');
    const presentation = fs.readFileSync(
      path.join(process.cwd(), 'lib/presentation/auth-verification/auth-verification.presentation.ts'),
      'utf8',
    );
    assert.match(presentation, /hasActionableAuthCallbackParams/);
    assert.match(presentation, /decideAuthCallbackStart/);
    assert.match(callback, /decideAuthCallbackStart/);
    assert.match(callback, /decision\.action !== 'start'/);
    assert.match(callback, /startedRef\.current = true/);
    const startGate = callback.slice(
      callback.indexOf('decideAuthCallbackStart'),
      callback.indexOf("decision.action !== 'start'") + "decision.action !== 'start'".length + 80,
    );
    assert.match(startGate, /decideAuthCallbackStart/);
    assert.match(startGate, /startedRef\.current = true/);
    assert.ok(startGate.indexOf('decideAuthCallbackStart') < startGate.indexOf('startedRef.current = true'));
    assert.ok(startGate.indexOf("decision.action !== 'start'") < startGate.indexOf('startedRef.current = true'));
  });

  it('treats pending signup as check-email rather than an auth error', () => {
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const index = fs.readFileSync(path.join(process.cwd(), 'app/index.tsx'), 'utf8');
    assert.match(signUp, /signUpWithEmail/);
    assert.match(signUp, /router\.push\(/);
    assert.match(signUp, /pathname: routes\.authCheckEmail/);
    assert.match(signUp, /params: \{ email: result\.outcome\.email \}/);
    assert.match(signUp, /router\.replace\(routes\.root\)/);
    assert.doesNotMatch(signUp, /emailRedirectTo|exchangeCodeForSession|completeAuthEmailCallback/);
    assert.match(signUp, /hasRequiredAnonymousSignupBaseline/);
    assert.match(provider, /pending_verification/);
    assert.match(provider, /bindPendingOnboardingToUser\(result\.value\.ownerId\)/);
    assert.match(provider, /savePendingSignupVerification/);
    assert.match(provider, /return \{ ok: true as const, outcome: result\.value \};/);
    assert.match(index, /visibleGate\.destination === 'check-email'/);
    assert.match(index, /pathname: routes\.authCheckEmail/);
    const pendingNav = signUp.slice(
      signUp.indexOf("result.outcome.kind === 'pending_verification'"),
      signUp.indexOf('router.replace(routes.root)'),
    );
    assert.ok(pendingNav.indexOf('Keyboard.dismiss()') < pendingNav.indexOf('router.push'));
    assert.doesNotMatch(pendingNav, /router\.replace/);
  });

  it('does not store or display the password on check-email', () => {
    const checkEmail = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/check-email.tsx'), 'utf8');
    const view = fs.readFileSync(path.join(process.cwd(), 'components/auth/CheckEmailView.tsx'), 'utf8');
    assert.doesNotMatch(checkEmail, /password/i);
    assert.doesNotMatch(view, /password/i);
    assert.match(checkEmail, /params\.email/);
  });

  it('redirects an authenticated check-email viewer to root and keeps unauthenticated UX', () => {
    const layout = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/_layout.tsx'), 'utf8');
    const checkEmail = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/check-email.tsx'), 'utf8');
    const view = fs.readFileSync(path.join(process.cwd(), 'components/auth/CheckEmailView.tsx'), 'utf8');
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');

    assert.match(layout, /isReady && status === 'authenticated'/);
    assert.match(layout, /Redirect href=\{routes\.root\}/);
    assert.match(layout, /if \(isReady && status === 'authenticated'\) \{/);
    assert.match(layout, /return <Redirect href=\{routes\.root\} \/>/);
    assert.ok(layout.indexOf('return <Redirect href={routes.root} />') < layout.indexOf('<Stack'));
    assert.doesNotMatch(layout, /<>[\s\S]*<Stack[\s\S]*Redirect/);
    assert.match(layout, /name="check-email"/);
    assert.match(layout, /gestureEnabled: false/);
    assert.match(checkEmail, /shouldPreventCheckEmailNativeBack/);
    assert.match(checkEmail, /Redirect href=\{routes\.root\}/);
    assert.match(view, /href=\{routes\.authSignIn\}/);
    assert.match(view, /AUTH_VERIFICATION_COPY\.returnToSignIn/);
    assert.match(view, /AUTH_VERIFICATION_COPY\.useAnotherEmail/);
    assert.match(checkEmail, /CheckEmailView/);
    assert.match(checkEmail, /releasePendingOnboardingFromOwner/);
    assert.match(checkEmail, /clearPendingSignupVerification/);
    assert.match(checkEmail, /router\.replace\(routes\.authSignUp\)/);
    assert.doesNotMatch(checkEmail, /startNewAnonymousOnboarding/);
    assert.doesNotMatch(checkEmail, /routes\.onboarding[^A-Za-z]/);
    assert.doesNotMatch(view, /onboarding\.getStarted|Kom igång/);
    assert.match(checkEmail, /resendSignupVerification/);
    assert.match(checkEmail, /AUTH_RESEND_COOLDOWN_MS/);
    assert.doesNotMatch(checkEmail, /deleteCurrentAccount|account-delete|serviceRole/);
    assert.doesNotMatch(
      checkEmail,
      /clearUnownedPendingAgeConfirmation|clearUnownedPendingHealthDataConsent|startNewAnonymousOnboarding/,
    );
    assert.match(signUp, /useState\(''\)/);
    assert.match(signUp, /useState\(''\)[\s\S]*useState\(''\)/);
  });

  it('keeps pending profile and Initial Lifestyle until a verified session exists', () => {
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const pendingBlock = provider.slice(
      provider.indexOf("if (result.value.kind === 'pending_verification')"),
      provider.indexOf('setSession(result.value.session)'),
    );
    assert.match(pendingBlock, /pending_verification/);
    assert.match(pendingBlock, /bindPendingOnboardingToUser\(result\.value\.ownerId\)/);
    assert.match(pendingBlock, /savePendingSignupVerification/);
    assert.doesNotMatch(pendingBlock, /syncPendingProfileAfterAuth/);
    assert.doesNotMatch(pendingBlock, /persistPendingInitialLifestyleAfterAuth/);
  });

  it('keeps verified sign-in persist and authenticated Home routing', () => {
    const signIn = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-in.tsx'), 'utf8');
    const index = fs.readFileSync(path.join(process.cwd(), 'app/index.tsx'), 'utf8');
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    const signInBlock = provider.slice(
      provider.indexOf('const signInWithEmail'),
      provider.indexOf('const signUpWithEmail'),
    );
    assert.match(signIn, /router\.replace\(routes\.root\)/);
    assert.match(index, /resolveAppGate/);
    assert.match(index, /visibleGate\.destination === 'home'/);
    assert.match(provider, /const result = await authService\.signInWithEmail/);
    assert.match(signInBlock, /await clearUnownedPendingOnboardingForExistingSignIn\(\);/);
    assert.doesNotMatch(signInBlock, /bindPendingOnboardingToUser/);
    assert.match(provider, /const profileSync = await syncPendingProfileAfterAuth\(\);/);
    assert.match(provider, /const lifestyleSync = await persistPendingInitialLifestyleAfterAuth\(result\.value\.user\.id\);/);
    assert.match(signInBlock, /if \(profileSync\.ok && lifestyleSync\.ok\)/);
    assert.match(signInBlock, /clearCompletedOnboardingLocalData\(result\.value\.user\.id\)/);
  });
});
