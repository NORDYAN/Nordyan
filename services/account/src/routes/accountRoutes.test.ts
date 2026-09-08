import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';

import { createAccountApp } from '../createAccountApp';

async function listen(
  app: ReturnType<typeof createAccountApp>['app'],
): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address() as AddressInfo;
  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

describe('account delete HTTP', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  let baseUrl = '';
  let close: (() => Promise<void>) | undefined;
  const deletedUserIds: string[] = [];

  before(async () => {
    process.env.NODE_ENV = 'test';
    deletedUserIds.length = 0;
    const { app } = createAccountApp(
      {
        NODE_ENV: 'test',
        ACCOUNT_SERVER_PORT: '0',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      },
      {
        verifyAccessToken: async (token) => (token === 'valid-token' ? 'user-1' : null),
        deleteAuthUser: async (userId) => {
          deletedUserIds.push(userId);
          if (userId === 'already-gone') {
            return { ok: true, alreadyDeleted: true };
          }
          return { ok: true, alreadyDeleted: false };
        },
      },
    );
    const listening = await listen(app);
    baseUrl = listening.baseUrl;
    close = listening.close;
  });

  after(async () => {
    await close?.();
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('serves health without auth', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const json = (await response.json()) as { ok: boolean; service: string };
    assert.equal(json.ok, true);
    assert.equal(json.service, 'nordyan-account');
  });

  it('rejects missing bearer tokens with 401 and does not delete', async () => {
    deletedUserIds.length = 0;
    const response = await fetch(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(deletedUserIds, []);
  });

  it('rejects invalid bearer tokens with 401 and does not delete', async () => {
    deletedUserIds.length = 0;
    const response = await fetch(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer bad-token',
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 401);
    assert.deepEqual(deletedUserIds, []);
  });

  it('deletes only the verified JWT subject on the happy path', async () => {
    deletedUserIds.length = 0;
    const response = await fetch(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as { ok: boolean };
    assert.equal(json.ok, true);
    assert.deepEqual(deletedUserIds, ['user-1']);
  });

  it('ignores a request-body user_id and still deletes the JWT subject', async () => {
    deletedUserIds.length = 0;
    const response = await fetch(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ user_id: 'other-user', userId: 'other-user' }),
    });
    assert.equal(response.status, 200);
    assert.deepEqual(deletedUserIds, ['user-1']);
    assert.equal(deletedUserIds.includes('other-user'), false);
  });
});

describe('account delete idempotent already-deleted', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  let baseUrl = '';
  let close: (() => Promise<void>) | undefined;

  before(async () => {
    process.env.NODE_ENV = 'test';
    const { app } = createAccountApp(
      {
        NODE_ENV: 'test',
        ACCOUNT_SERVER_PORT: '0',
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon',
        SUPABASE_SERVICE_ROLE_KEY: 'test-service-role',
      },
      {
        verifyAccessToken: async (token) => (token === 'valid-token' ? 'already-gone' : null),
        deleteAuthUser: async () => ({ ok: true, alreadyDeleted: true }),
      },
    );
    const listening = await listen(app);
    baseUrl = listening.baseUrl;
    close = listening.close;
  });

  after(async () => {
    await close?.();
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
  });

  it('returns success when the auth user is already gone', async () => {
    const response = await fetch(`${baseUrl}/api/account/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as { ok: boolean };
    assert.equal(json.ok, true);
  });
});
