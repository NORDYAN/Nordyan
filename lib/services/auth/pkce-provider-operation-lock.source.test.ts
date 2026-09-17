import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('PKCE signup serialization source contracts', () => {
  it('acquires the signup submit guard before the first awaited baseline work', () => {
    const signUp = source('app/(auth)/sign-up.tsx');
    const submit = signUp.slice(signUp.indexOf('const handleSubmit'), signUp.indexOf('return ('));

    assert.match(submit, /signupInFlightRef\.current/);
    assert.match(submit, /hasRequiredAnonymousSignupBaseline\(\)/);
    assert.ok(submit.indexOf('signupInFlightRef.current = true') < submit.indexOf('await hasRequiredAnonymousSignupBaseline()'));
    assert.ok(submit.indexOf('if (signupInFlightRef.current)') < submit.indexOf('signupInFlightRef.current = true'));
    assert.match(submit, /finally \{/);
    assert.match(submit, /signupInFlightRef\.current = false/);
    assert.match(submit, /setIsSubmitting\(true\)/);
    assert.match(submit, /setIsSubmitting\(false\)/);
    assert.ok(submit.indexOf('await hasRequiredAnonymousSignupBaseline()') < submit.indexOf('await signUpWithEmail(email, password)'));
  });

  it('serializes provider signup and resend so overlapping calls cannot share the PKCE verifier', () => {
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const lock = source('lib/services/auth/pkce-provider-operation-lock.ts');
    const trace = source('lib/presentation/auth-verification/auth-callback-trace.ts');
    const signUpBlock = repository.slice(
      repository.indexOf('async signUpWithEmail'),
      repository.indexOf('async resendSignupVerification'),
    );
    const resendBlock = repository.slice(
      repository.indexOf('async resendSignupVerification'),
      repository.indexOf('async requestPasswordRecovery'),
    );

    assert.match(lock, /signup\.provider\.operation\.start/);
    assert.match(lock, /signup\.provider\.operation\.finish/);
    assert.match(lock, /signup\.provider\.operation\.blocked/);
    assert.match(trace, /__DEV__/);
    assert.doesNotMatch(lock, /email|password|access_token|refresh_token|code_verifier|jwt/i);
    assert.match(signUpBlock, /runPkceProviderOperation\(\s*'signup'/);
    assert.ok(signUpBlock.indexOf("runPkceProviderOperation(") < signUpBlock.indexOf('supabase.auth.signUp'));
    assert.match(resendBlock, /runPkceProviderOperation\(\s*'resend'/);
    assert.ok(resendBlock.indexOf("runPkceProviderOperation(") < resendBlock.indexOf('supabase.auth.resend'));
    assert.match(repository, /exchangeCodeForSession\(trimmedCode\)/);
    assert.doesNotMatch(repository, /exchangeCodeForSession\([^)]*sb_flow_id/);
  });

  it('keeps pending verification, callback exchange, and A6 routing unchanged', () => {
    const signUp = source('app/(auth)/sign-up.tsx');
    const callback = source('app/auth/callback.tsx');
    const complete = source('lib/presentation/auth-verification/complete-auth-email-callback.ts');
    const client = source('lib/supabase/client.ts');
    const step4 = source('app/(onboarding)/step-4.tsx');
    const checkEmail = source('app/(auth)/check-email.tsx');

    assert.match(signUp, /result\.outcome\.kind === 'pending_verification'/);
    assert.match(signUp, /pathname: routes\.authCheckEmail/);
    assert.match(callback, /completeAuthEmailCallback/);
    assert.match(callback, /startedRef\.current = true/);
    assert.match(complete, /exchangeCode\(parsed\.code\)/);
    assert.match(client, /flowType:\s*'pkce'/);
    assert.match(step4, /label=\{t\('common\.continue'\)\}/);
    assert.match(step4, /router\.push\(routes\.onboardingNotificationSetup\)/);
    assert.match(checkEmail, /resendInFlightRef/);
    const resend = checkEmail.slice(
      checkEmail.indexOf('const handleResend'),
      checkEmail.indexOf('const handleUseAnotherEmail'),
    );
    assert.ok(resend.indexOf('resendInFlightRef.current = true') < resend.indexOf('await resendSignupVerification'));
    assert.doesNotMatch(callback, /runPkceProviderOperation/);
    assert.doesNotMatch(complete, /runPkceProviderOperation/);
  });
});
