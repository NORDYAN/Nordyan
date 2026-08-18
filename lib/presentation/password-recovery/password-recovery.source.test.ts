import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('password recovery source contracts', () => {
  it('adds a subordinate forgot-password link to sign-in', () => {
    const signIn = source('app/(auth)/sign-in.tsx');
    const form = source('components/auth/AuthForm.tsx');
    assert.match(signIn, /passwordActionHref=\{routes\.authForgotPassword\}/);
    assert.match(signIn, /auth\.recovery\.forgotPassword/);
    assert.match(form, /accessibilityRole="link"/);
  });

  it('requests the recovery email with the dedicated native callback', () => {
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const redirect = source('lib/services/auth/auth-redirect.ts');
    const supabaseConfig = source('supabase/config.toml');
    assert.match(repository, /resetPasswordForEmail\(email\.trim\(\),\s*\{/);
    assert.match(repository, /redirectTo:\s*getPasswordRecoveryRedirectTo\(\)/);
    assert.match(redirect, /PASSWORD_RECOVERY_CALLBACK_PATH = '\/auth\/recovery-callback'/);
    assert.match(redirect, /`nordyan:\/\/\$\{PASSWORD_RECOVERY_CALLBACK_PATH/);
    assert.match(supabaseConfig, /"nordyan:\/\/auth\/callback"/);
    assert.match(supabaseConfig, /"nordyan:\/\/auth\/recovery-callback"/);
  });

  it('keeps recovery callback structurally isolated from onboarding persistence', () => {
    const callback = source('app/auth/recovery-callback.tsx');
    const rootLayout = source('app/_layout.tsx');
    const completion = source(
      'lib/presentation/password-recovery/password-recovery.presentation.ts',
    );
    const forbidden =
      /bindPending|syncPending|persistPending|clearCompletedOnboarding|snapshot|InitialLifestyle/;

    assert.doesNotMatch(callback, forbidden);
    assert.doesNotMatch(completion, forbidden);
    assert.match(callback, /router\.replace\(routes\.authResetPassword\)/);
    assert.match(callback, /activatePasswordRecovery/);
    assert.match(rootLayout, /name="auth\/recovery-callback"/);
    assert.match(rootLayout, /name="auth\/reset-password"/);
  });

  it('updates the password only inside an active recovery session and routes through root', () => {
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const reset = source('app/auth/reset-password.tsx');
    const provider = source('providers/auth-provider.tsx');
    const recoveryBlock = provider.slice(
      provider.indexOf('const updateRecoveredPassword'),
      provider.indexOf('const signOut'),
    );

    assert.match(repository, /auth\.updateUser\(\{ password \}\)/);
    assert.match(recoveryBlock, /!isPasswordRecovery \|\| !session/);
    assert.doesNotMatch(recoveryBlock, /bindPending|syncPending|persistPending|snapshot/);
    assert.match(reset, /router\.replace\(routes\.root\)/);
  });

  it('offers a new link for invalid recovery callbacks instead of a dead spinner', () => {
    const callback = source('app/auth/recovery-callback.tsx');
    const reset = source('app/auth/reset-password.tsx');
    assert.match(callback, /auth\.recovery\.callback\.requestNewLink/);
    assert.match(callback, /routes\.authForgotPassword/);
    assert.match(reset, /routes\.authForgotPassword/);
  });

  it('does not log or persist recovery secrets and never puts passwords in route params', () => {
    const files = [
      'app/(auth)/forgot-password.tsx',
      'app/auth/recovery-callback.tsx',
      'app/auth/reset-password.tsx',
      'components/auth/PasswordRecoveryRequestView.tsx',
      'components/auth/ResetPasswordView.tsx',
      'lib/presentation/password-recovery/password-recovery.presentation.ts',
      'lib/repositories/supabase-auth.repository.ts',
      'lib/services/auth/auth.service.ts',
    ];
    for (const file of files) {
      const text = source(file);
      assert.doesNotMatch(text, /console\.(log|info|debug|warn|error)/);
    }

    const recoveryScreens = files.slice(0, 6).map(source).join('\n');
    assert.doesNotMatch(recoveryScreens, /AsyncStorage|setItem\(/);
    assert.doesNotMatch(
      source('app/auth/reset-password.tsx'),
      /params\.(password|confirmation)|useLocalSearchParams/,
    );
  });

  it('leaves the signup verification callback and its onboarding persistence intact', () => {
    const callback = source('app/auth/callback.tsx');
    assert.match(callback, /completeAuthEmailCallback/);
    assert.match(callback, /syncPendingProfileAfterAuth/);
    assert.match(callback, /persistPendingInitialLifestyleAfterAuth/);
    assert.match(callback, /clearCompletedOnboardingLocalData/);
    assert.match(callback, /router\.replace\(routes\.root\)/);
  });
});
