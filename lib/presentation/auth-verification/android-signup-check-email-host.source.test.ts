import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import { resolveUnauthenticatedAppGate } from '@/lib/onboarding/resolve-unauthenticated-app-gate';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('Android signup check-email Fabric host contracts', () => {
  it('writes the verification record before a check-email PUSH', () => {
    const provider = source('providers/auth-provider.tsx');
    const signUp = source('app/(auth)/sign-up.tsx');
    const pendingBlock = provider.slice(
      provider.indexOf("if (result.value.kind === 'pending_verification')"),
      provider.indexOf('return { ok: true as const, outcome: result.value }'),
    );
    assert.match(pendingBlock, /savePendingSignupVerification/);
    assert.match(pendingBlock, /bindPendingOnboardingToUser/);
    const pendingNav = signUp.slice(
      signUp.indexOf("result.outcome.kind === 'pending_verification'"),
      signUp.indexOf('router.replace(routes.root)'),
    );
    assert.ok(signUp.indexOf('await signUpWithEmail') < signUp.indexOf("result.outcome.kind === 'pending_verification'"));
    assert.ok(pendingNav.indexOf('Keyboard.dismiss()') < pendingNav.indexOf('router.push'));
    assert.match(pendingNav, /pathname: routes\.authCheckEmail/);
    assert.match(pendingNav, /params: \{ email: result\.outcome\.email \}/);
    assert.doesNotMatch(pendingNav, /router\.replace/);
    assert.doesNotMatch(pendingNav, /routes\.root/);
  });

  it('keeps cold-start wait-record routing on the root gate', () => {
    const index = source('app/index.tsx');
    assert.match(index, /getPendingSignupVerification/);
    assert.match(index, /visibleGate\.destination === 'check-email'/);
    assert.match(index, /pathname: routes\.authCheckEmail/);
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: 'jan@nordyan.se',
      }),
      { destination: 'check-email', email: 'jan@nordyan.se' },
    );
    assert.deepEqual(
      resolveUnauthenticatedAppGate({
        isReady: true,
        pendingVerificationEmail: null,
      }),
      { destination: 'onboarding' },
    );
  });

  it('blocks native back into signup while keeping explicit check-email actions', () => {
    const layout = source('app/(auth)/_layout.tsx');
    const checkEmail = source('app/(auth)/check-email.tsx');
    const view = source('components/auth/CheckEmailView.tsx');
    assert.match(layout, /name="check-email"/);
    assert.match(layout, /gestureEnabled: false/);
    assert.match(checkEmail, /shouldPreventCheckEmailNativeBack/);
    assert.match(checkEmail, /beforeRemove/);
    assert.match(checkEmail, /resendSignupVerification/);
    assert.match(checkEmail, /router\.replace\(routes\.authSignUp\)/);
    assert.match(view, /AUTH_VERIFICATION_COPY\.returnToSignIn/);
    assert.match(view, /AUTH_VERIFICATION_COPY\.useAnotherEmail/);
    assert.doesNotMatch(checkEmail, /clearPendingSignupVerification\(\);[\s\S]*beforeRemove/);
  });

  it('does not change iOS sign-in replace, onboarding order, AuthProvider, or NotificationLifecycle', () => {
    const signIn = source('app/(auth)/sign-in.tsx');
    const step2 = source('app/(onboarding)/step-2.tsx');
    const age = source('app/(onboarding)/age-confirmation.tsx');
    const step5 = source('app/(onboarding)/step-5.tsx');
    const lifecycle = source('lib/presentation/notifications/NotificationLifecycle.tsx');
    const callback = source('app/auth/callback.tsx');
    const provider = source('providers/auth-provider.tsx');

    assert.match(signIn, /router\.replace\(routes\.root\)/);
    assert.match(callback, /router\.replace\(routes\.root\)/);
    assert.match(step2, /routes\.onboardingHealthDataConsent/);
    assert.doesNotMatch(step2, /routes\.onboardingAgeConfirmation/);
    assert.match(age, /Redirect href=\{routes\.onboardingHealthDataConsent\}/);
    assert.match(step5, /routes\.authSignUp/);
    assert.match(lifecycle, /decideNotificationScheduleSync/);
    assert.match(provider, /savePendingSignupVerification/);
    assert.doesNotMatch(provider, /router\.(push|replace)/);
  });
});
