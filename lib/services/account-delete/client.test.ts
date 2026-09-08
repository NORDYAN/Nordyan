import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';

import { requestAccountDelete } from './client';

describe('requestAccountDelete', () => {
  const previous = process.env.EXPO_PUBLIC_ACCOUNT_API_URL;

  afterEach(() => {
    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_ACCOUNT_API_URL;
    } else {
      process.env.EXPO_PUBLIC_ACCOUNT_API_URL = previous;
    }
  });

  it('returns not_configured when the public URL is missing', async () => {
    delete process.env.EXPO_PUBLIC_ACCOUNT_API_URL;
    const result = await requestAccountDelete({ accessToken: 'token' });
    assert.deepEqual(result, { ok: false, reason: 'not_configured' });
  });

  it('posts an empty body with the bearer token and no user_id', async () => {
    process.env.EXPO_PUBLIC_ACCOUNT_API_URL = 'https://account.example';
    let capturedUrl = '';
    let capturedInit: RequestInit | undefined;

    const result = await requestAccountDelete({
      accessToken: 'session-token',
      fetchImpl: (async (url, init) => {
        capturedUrl = String(url);
        capturedInit = init;
        return new Response(JSON.stringify({ ok: true }), { status: 200 });
      }) as typeof fetch,
    });

    assert.deepEqual(result, { ok: true });
    assert.equal(capturedUrl, 'https://account.example/api/account/delete');
    const headers = capturedInit?.headers as Record<string, string>;
    assert.equal(headers.Authorization, 'Bearer session-token');
    assert.equal(capturedInit?.body, '{}');
    assert.equal(String(capturedInit?.body).includes('user_id'), false);
    assert.equal(String(capturedInit?.body).includes('userId'), false);
  });

  it('maps 401 to unauthorized without treating it as success', async () => {
    process.env.EXPO_PUBLIC_ACCOUNT_API_URL = 'https://account.example';
    const result = await requestAccountDelete({
      accessToken: 'expired',
      fetchImpl: (async () => new Response('', { status: 401 })) as typeof fetch,
    });
    assert.deepEqual(result, { ok: false, reason: 'unauthorized' });
  });
});
