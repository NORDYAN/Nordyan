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

  const sampleAsk = {
    version: 'coach-ask-v1.1',
    locale: 'sv-SE',
    generatedAt: '2026-08-12T12:00:00.000Z',
    context: {
      healthState: {
        overallScore: 74,
        scoreBandLabel: 'Bra hälsonivå',
        scoreChange: { status: 'ready', change: 6, direction: 'up' },
        weight: { status: 'ready', currentKg: 80, changeKg: -2, direction: 'down' },
        waist: { status: 'ready', currentCm: 90, changeCm: -2, direction: 'down' },
        healthScoreActivity: { status: 'ready', current: 58, change: 8, direction: 'up' },
      },
      development: {
        trend: 'improving',
        historyStatus: 'comparable',
      },
      focus: {
        type: 'reduce_waist',
        title: 'Minska midjemåttet',
        subtitle: 'Det är den förändring som har störst potential att förbättra din NORDYAN Score.',
      },
      plan: {
        recommendationId: 'waist_walk_after_dinner_v1',
        title: 'Promenad efter middagen',
        description: 'Promenera 30 minuter efter middagen fyra dagar den här veckan.',
        durationMinutes: 30,
        frequencyPerWeek: 4,
      },
      availability: {
        healthScoreAvailable: true,
        measurementHistoryComparable: true,
        sleepDataAvailable: false,
        deviceActivityAvailable: false,
        integratedHealthAvailable: false,
        stepsDataAvailable: false,
      },
    },
    question: 'Varför är detta mitt fokus?',
  };

  it('rejects unauthenticated ask requests', async () => {
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sampleAsk),
    });
    assert.equal(response.status, 401);
  });

  it('returns unavailable ask response for v1.2 when OpenAI is not configured', async () => {
    rateLimiter.reset();
    const sampleAskV12 = {
      ...sampleAsk,
      version: 'coach-ask-v1.2',
      context: {
        ...sampleAsk.context,
        weeklyCheckIn: null,
      },
    };
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAskV12),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string; promptVersion?: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(json.meta.promptVersion, 'nordyan-coach-ask-v1.2');
  });

  it('returns unavailable ask response for v1.3 when OpenAI is not configured', async () => {
    rateLimiter.reset();
    const sampleAskV13 = {
      ...sampleAsk,
      version: 'coach-ask-v1.3',
      context: {
        ...sampleAsk.context,
        weeklyCheckIn: null,
        initialLifestyle: null,
      },
    };
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAskV13),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string; promptVersion?: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(json.meta.promptVersion, 'nordyan-coach-ask-v1.3');
  });

  it('returns unavailable ask response for v1.4 when OpenAI is not configured', async () => {
    rateLimiter.reset();
    const sampleAskV14 = {
      ...sampleAsk,
      version: 'coach-ask-v1.4',
      context: {
        ...sampleAsk.context,
        weeklyCheckIn: null,
        initialLifestyle: null,
        healthState: {
          ...sampleAsk.context.healthState,
          bodyComposition: {
            status: 'ready',
            bodyFatPercent: 20.1,
            estimationKind: 'calculated_from_latest_snapshot',
          },
        },
        ageBand: '40_49',
        sex: 'male',
      },
    };
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAskV14),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string; promptVersion?: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(json.meta.promptVersion, 'nordyan-coach-ask-v1.4');
  });

  it('returns unavailable ask response for v1.5 when OpenAI is not configured', async () => {
    rateLimiter.reset();
    const sampleAskV15 = {
      ...sampleAsk,
      version: 'coach-ask-v1.5',
      context: {
        ...sampleAsk.context,
        weeklyCheckIn: null,
        initialLifestyle: null,
        healthState: {
          ...sampleAsk.context.healthState,
          bodyComposition: {
            status: 'ready',
            bodyFatPercent: 20.83,
            estimationKind: 'calculated_from_latest_snapshot',
          },
        },
        ageBand: '50_59',
        sex: 'male',
        bodyFatReference: {
          status: 'ready',
          source: 'acsm_getp_10_11_cooper_institute',
          sex: 'male',
          referenceAgeGroup: '50_59',
          bodyFatPercent: 20.83,
          referenceMedianPercent: 23.2,
          comparisonToReferenceMedian: 'below',
          referencePositionBand: 'below_median',
        },
      },
    };
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAskV15),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string; promptVersion?: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(json.meta.promptVersion, 'nordyan-coach-ask-v1.5');
  });

  it('returns unavailable ask response for v1.6 and keeps v1.5 routing', async () => {
    rateLimiter.reset();
    const sampleAskV16 = {
      ...sampleAsk,
      version: 'coach-ask-v1.6',
      locale: 'nb-NO',
      context: {
        ...sampleAsk.context,
        weeklyCheckIn: null,
        initialLifestyle: null,
        healthState: {
          ...sampleAsk.context.healthState,
          bodyComposition: {
            status: 'ready',
            bodyFatPercent: 20.83,
            estimationKind: 'calculated_from_latest_snapshot',
          },
        },
        ageBand: '50_59',
        sex: 'male',
        bodyFatReference: {
          status: 'ready',
          source: 'acsm_getp_10_11_cooper_institute',
          sex: 'male',
          referenceAgeGroup: '50_59',
          bodyFatPercent: 20.83,
          referenceMedianPercent: 23.2,
          comparisonToReferenceMedian: 'below',
          referencePositionBand: 'below_median',
        },
      },
    };
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAskV16),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string; promptVersion?: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(json.meta.promptVersion, 'nordyan-coach-ask-v1.6');
  });

  it('rejects nb-NO on a frozen v1.5 ask payload', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        ...sampleAsk,
        version: 'coach-ask-v1.5',
        locale: 'nb-NO',
        context: {
          ...sampleAsk.context,
          weeklyCheckIn: null,
          initialLifestyle: null,
          healthState: {
            ...sampleAsk.context.healthState,
            bodyComposition: {
              status: 'unavailable',
              bodyFatPercent: null,
              estimationKind: 'unavailable',
            },
          },
          ageBand: null,
          sex: null,
          bodyFatReference: {
            status: 'unavailable',
            unavailableReason: 'missing_body_fat_percent',
          },
        },
      }),
    });
    assert.equal(response.status, 400);
  });

  it('rejects v1.5 fields on a v1.4 ask payload', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        ...sampleAsk,
        version: 'coach-ask-v1.4',
        context: {
          ...sampleAsk.context,
          weeklyCheckIn: null,
          initialLifestyle: null,
          ageBand: '50_59',
          sex: 'male',
          bodyFatReference: {
            status: 'unavailable',
            unavailableReason: 'missing_body_fat_percent',
          },
        },
      }),
    });
    assert.equal(response.status, 400);
  });

  it('rejects v1.4 fields on a v1.3 ask payload', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({
        ...sampleAsk,
        version: 'coach-ask-v1.3',
        context: {
          ...sampleAsk.context,
          weeklyCheckIn: null,
          initialLifestyle: null,
          ageBand: '40_49',
          sex: 'male',
        },
      }),
    });
    assert.equal(response.status, 400);
  });

  it('returns unavailable ask response when OpenAI is not configured', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAsk),
    });
    assert.equal(response.status, 200);
    const json = (await response.json()) as {
      answer: string;
      meta: { source: string; requestId: string };
    };
    assert.equal(json.meta.source, 'unavailable');
    assert.equal(typeof json.meta.requestId, 'string');
  });

  it('rejects invalid ask payloads with 400', async () => {
    rateLimiter.reset();
    const response = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify({ ...sampleAsk, question: '' }),
    });
    assert.equal(response.status, 400);
  });

  it('shares rate limit bucket across generate and ask', async () => {
    rateLimiter.reset();

    const generateOk = await fetch(`${baseUrl}/api/coach/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(samplePayload),
    });
    assert.equal(generateOk.status, 200);

    const askOk = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAsk),
    });
    assert.equal(askOk.status, 200);

    const limited = await fetch(`${baseUrl}/api/coach/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer valid-token',
      },
      body: JSON.stringify(sampleAsk),
    });
    assert.equal(limited.status, 429);
  });
});
