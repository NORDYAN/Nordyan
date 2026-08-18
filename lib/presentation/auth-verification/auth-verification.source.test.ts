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

  it('treats pending signup as check-email rather than an auth error', () => {
    const signUp = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/sign-up.tsx'), 'utf8');
    const provider = fs.readFileSync(path.join(process.cwd(), 'providers/auth-provider.tsx'), 'utf8');
    assert.match(signUp, /pending_verification/);
    assert.match(signUp, /authCheckEmail/);
    assert.match(provider, /pending_verification/);
    assert.match(provider, /bindPendingOnboardingToUser\(result\.value\.ownerId\)/);
    assert.match(provider, /return \{ ok: true as const, outcome: result\.value \};/);
  });

  it('does not store or display the password on check-email', () => {
    const checkEmail = fs.readFileSync(path.join(process.cwd(), 'app/(auth)/check-email.tsx'), 'utf8');
    const view = fs.readFileSync(path.join(process.cwd(), 'components/auth/CheckEmailView.tsx'), 'utf8');
    assert.doesNotMatch(checkEmail, /password/i);
    assert.doesNotMatch(view, /password/i);
    assert.match(checkEmail, /params\.email/);
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
    assert.match(index, /gate\.destination === 'home'/);
    assert.match(provider, /const result = await authService\.signInWithEmail/);
    assert.match(signInBlock, /await clearUnownedPendingOnboardingForExistingSignIn\(\);/);
    assert.doesNotMatch(signInBlock, /bindPendingOnboardingToUser/);
    assert.match(provider, /const profileSync = await syncPendingProfileAfterAuth\(\);/);
    assert.match(provider, /const lifestyleSync = await persistPendingInitialLifestyleAfterAuth\(result\.value\.user\.id\);/);
    assert.match(signInBlock, /if \(profileSync\.ok && lifestyleSync\.ok\)/);
    assert.match(signInBlock, /clearCompletedOnboardingLocalData\(result\.value\.user\.id\)/);
  });
});
