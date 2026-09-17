import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import {
  beginPkceProviderOperation,
  finishPkceProviderOperation,
  resetPkceProviderOperationLockForTests,
  runPkceProviderOperation,
} from './pkce-provider-operation-lock';

afterEach(() => {
  resetPkceProviderOperationLockForTests();
});

describe('PKCE provider operation lock', () => {
  it('blocks a second signup until the first operation finishes', async () => {
    let started = 0;
    let releaseFirst!: () => void;
    const firstHold = new Promise<void>((resolve) => {
      releaseFirst = resolve;
    });

    const first = runPkceProviderOperation(
      'signup',
      async () => {
        started += 1;
        await firstHold;
        return 'first';
      },
      () => 'blocked',
    );
    const second = runPkceProviderOperation(
      'signup',
      async () => {
        started += 1;
        return 'second';
      },
      () => 'blocked',
    );

    await Promise.resolve();
    assert.equal(started, 1);
    assert.deepEqual(await second, 'blocked');

    releaseFirst();
    assert.equal(await first, 'first');
    assert.equal(started, 1);
  });

  it('blocks resend while signup is in flight and allows retry after failure', async () => {
    let signupCalls = 0;
    let resendCalls = 0;
    let releaseSignup!: () => void;
    const hold = new Promise<void>((resolve) => {
      releaseSignup = resolve;
    });

    const signup = runPkceProviderOperation(
      'signup',
      async () => {
        signupCalls += 1;
        await hold;
        throw new Error('provider 500');
      },
      () => 'blocked-signup',
    );
    const resend = runPkceProviderOperation(
      'resend',
      async () => {
        resendCalls += 1;
        return 'resent';
      },
      () => 'blocked-resend',
    );

    assert.equal(await resend, 'blocked-resend');
    assert.equal(resendCalls, 0);

    releaseSignup();
    await assert.rejects(signup, /provider 500/);
    assert.equal(signupCalls, 1);

    const retry = await runPkceProviderOperation(
      'signup',
      async () => {
        signupCalls += 1;
        return 'retried';
      },
      () => 'blocked-signup',
    );
    assert.equal(retry, 'retried');
    assert.equal(signupCalls, 2);
  });

  it('releases the lock after a successful operation so a later call can start', async () => {
    const first = await runPkceProviderOperation('signup', async () => 'ok', () => 'blocked');
    const second = await runPkceProviderOperation('signup', async () => 'again', () => 'blocked');
    assert.equal(first, 'ok');
    assert.equal(second, 'again');
  });

  it('uses a monotonic operation id and does not expose secrets', () => {
    const first = beginPkceProviderOperation('signup');
    const blocked = beginPkceProviderOperation('resend');
    assert.equal(first.started, true);
    if (!first.started) {
      return;
    }
    assert.equal(first.operationId, 1);
    assert.equal(blocked.started, false);
    if (blocked.started) {
      return;
    }
    assert.equal(blocked.blockedBy, 'signup');
    finishPkceProviderOperation(first.operationId);
    const retry = beginPkceProviderOperation('signup');
    assert.equal(retry.started, true);
    if (retry.started) {
      assert.equal(retry.operationId, 2);
      finishPkceProviderOperation(retry.operationId);
    }
  });
});
