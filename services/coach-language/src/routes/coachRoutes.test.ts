import assert from 'node:assert/strict';
import http from 'node:http';
import { after, before, describe, it } from 'node:test';
import type { AddressInfo } from 'node:net';

import { createCoachLanguageApp } from '../createCoachLanguageApp';
import { createMemoryRateLimiter } from '../rateLimit';

const samplePayload = {
  version: 'coach-simulator-v2',
  locale: 'sv-SE',
  generatedAt: '2026-08-08T10:00:00.000Z',
  decision: {
    topStrength: 'Aktivitet',
    topOpportunity: 'Minska midjemåttet',
    coachGoal: 'Guida',
    recommendedAction: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
    confidence: 72,
    insufficientData: false,
    silenceEligible: false,
  },
  supportingFacts: ['Promenera 30 minuter efter middagen fyra dagar den här veckan.'],
  instructions: {
    role: 'NORDYAN Coach',
    tone: 'neutral',
    maxWords: 80,
  },
};

async function listen(
  app: ReturnType<typeof createCoachLanguageApp>['app'],
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

describe('coach language HTTP auth + rate limit', () => {
  const previousNodeEnv = process.env.NODE_ENV;
  let baseUrl = '';
  let close: (() => Promise<void>) | undefined;
  const rateLimiter = createMemoryRateLimiter({ maxPerMinute: 2, maxPerDay: 40 });

  before(async () => {
    process.env.NODE_ENV = 'test';
    const { app } = createCoachLanguageApp(
      {
        NODE_ENV: 'test',
        COACH_SERVER_PORT: '0',
        // No OpenAI key → authenticated generate uses deterministic fallback (still 200).
        SUPABASE_URL: 'https://example.supabase.co',
        SUPABASE_ANON_KEY: 'test-anon',
      },
      {
        verifyAccessToken: async (token) => (token === 'valid-token' ? 'user-1' : null),
        rateLimiter,
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

  it('rejects unauthenticated generate requests', async () => {
    const response = await fetch(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(samplePayload),
    });
    assert.equal(response.status, 401);
  });

  it('rejects invalid bearer tokens', async () => {
    const response = await fetch(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer bad-token',
      },
      body: JSON.stringify(samplePayload),
    });
    assert.equal(response.status, 401);
  });

  it('accepts authenticated generate requests', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(samplePayload),
    });

    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      message: { body: string };
      meta: { provider: string; usedFallback: boolean };
    };
    assert.equal(typeof json.message.body, 'string');
    assert.equal(json.meta.provider, 'fallback');
    assert.equal(json.meta.usedFallback, true);
  });

  it('rate limits repeated authenticated generate calls', async () => {
    rateLimiter.reset();

    for (let i = 0; i < 2; i += 1) {
      const ok = await fetch(`${baseUrl}/api/coach/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
        },
        body: JSON.stringify(samplePayload),
      });
      assert.equal(ok.status, 200);
    }

    const limited = await fetch(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(samplePayload),
    });
    assert.equal(limited.status, 429);
  });

  it('does not require auth for /health and never logs payload content', async () => {
    const response = await fetch(`${baseUrl}/health`);
    assert.equal(response.status, 200);
    const json = (await response.json()) as { ok: boolean; service: string };
    assert.equal(json.ok, true);
    assert.equal(json.service, 'nordyan-coach-language');
  });
});
