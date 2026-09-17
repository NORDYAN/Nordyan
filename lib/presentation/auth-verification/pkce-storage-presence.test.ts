import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

import {
  classifyPkceStorageKeys,
  hasAuthCallbackFlowIdParam,
} from './pkce-storage-presence.classification';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

describe('PKCE storage presence diagnostics', () => {
  it('classifies default vs flow-scoped verifier keys without using key values as secrets', () => {
    const classified = classifyPkceStorageKeys([
      '@nordyan/pending_signup_verification',
      'sb-projectref-auth-token',
      'sb-projectref-auth-token-code-verifier',
      'sb-projectref-auth-token-code-verifier-flowabc',
    ]);

    assert.equal(classified.hasVerifierKey, true);
    assert.equal(classified.hasSupabaseAuthKey, true);
    assert.equal(classified.matchingVerifierKeyCount, 2);
    assert.equal(classified.defaultVerifierKeyCount, 1);
    assert.equal(classified.flowScopedVerifierKeyCount, 1);
    assert.equal('keys' in classified, false);
  });

  it('reports absence when only NORDYAN pending keys exist', () => {
    const classified = classifyPkceStorageKeys([
      '@nordyan/pending_notification_choice',
      '@nordyan/pending_profile',
    ]);

    assert.deepEqual(classified, {
      matchingVerifierKeyCount: 0,
      hasVerifierKey: false,
      hasSupabaseAuthKey: false,
      defaultVerifierKeyCount: 0,
      flowScopedVerifierKeyCount: 0,
    });
  });

  it('reports flow-id presence without exposing the value', () => {
    assert.equal(hasAuthCallbackFlowIdParam('flow-1'), true);
    assert.equal(hasAuthCallbackFlowIdParam(['flow-1']), true);
    assert.equal(hasAuthCallbackFlowIdParam('   '), false);
    assert.equal(hasAuthCallbackFlowIdParam(undefined), false);
  });

  it('is DEV-only, never reads storage values, and never logs secrets', () => {
    const helper = source('lib/presentation/auth-verification/pkce-storage-presence.ts');
    const classification = source(
      'lib/presentation/auth-verification/pkce-storage-presence.classification.ts',
    );
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const callback = source('app/auth/callback.tsx');

    assert.match(helper, /__DEV__/);
    assert.match(helper, /AsyncStorage\.getAllKeys/);
    assert.doesNotMatch(helper, /getItem|multiGet/);
    assert.doesNotMatch(helper, /access_token|refresh_token|password|email|jwt/i);
    assert.doesNotMatch(helper, /console\.(log|info|debug)/);
    assert.match(helper, /pkce\.storage\.presence/);
    assert.match(helper, /matchingVerifierKeyCount/);
    assert.match(helper, /hasVerifierKey/);
    assert.match(helper, /hasSupabaseAuthKey/);
    assert.match(helper, /hasFlowId/);
    assert.doesNotMatch(helper, /logNordyanAuthTrace\([^)]*code/);
    assert.doesNotMatch(helper, /logNordyanAuthTrace\([^)]*sb_flow_id/);
    assert.doesNotMatch(classification, /getItem|multiGet|AsyncStorage/);
    assert.doesNotMatch(classification, /access_token|refresh_token|password|email|jwt/i);

    assert.match(repository, /await logPkceStoragePresence\(\{ stage: 'after-signup' \}\)/);
    const signUpBlock = repository.slice(
      repository.indexOf('async signUpWithEmail'),
      repository.indexOf('async resendSignupVerification'),
    );
    assert.ok(signUpBlock.indexOf('supabase.auth.signUp') < signUpBlock.indexOf("stage: 'after-signup'"));

    assert.match(callback, /logPkceStoragePresence/);
    assert.match(callback, /stage: 'callback-start'/);
    assert.match(callback, /hasAuthCallbackFlowIdParam\(params\.sb_flow_id\)/);
    const runBlock = callback.slice(
      callback.indexOf('const run = useCallback'),
      callback.indexOf('}, [params]);'),
    );
    assert.ok(runBlock.indexOf('logPkceStoragePresence') < runBlock.indexOf('authService.getSession()'));
    assert.ok(runBlock.indexOf('logPkceStoragePresence') < runBlock.indexOf('completeAuthEmailCallback'));
    assert.ok(runBlock.indexOf('logPkceStoragePresence') < runBlock.indexOf('exchangeAuthCallbackCode'));
  });

  it('does not change PKCE exchange or callback start behavior', () => {
    const repository = source('lib/repositories/supabase-auth.repository.ts');
    const callback = source('app/auth/callback.tsx');
    const complete = source('lib/presentation/auth-verification/complete-auth-email-callback.ts');
    const client = source('lib/supabase/client.ts');
    const presentation = source(
      'lib/presentation/auth-verification/auth-verification.presentation.ts',
    );

    assert.match(repository, /exchangeCodeForSession\(trimmedCode\)/);
    assert.doesNotMatch(repository, /exchangeCodeForSession\([^)]*sb_flow_id/);
    assert.match(callback, /startedRef\.current = true/);
    assert.match(callback, /decideAuthCallbackStart/);
    assert.match(complete, /exchangeCode\(parsed\.code\)/);
    assert.doesNotMatch(complete, /sb_flow_id/);
    assert.match(client, /flowType:\s*'pkce'/);
    assert.match(client, /storage: AsyncStorage/);
    assert.match(presentation, /alreadyStarted/);
  });
});
