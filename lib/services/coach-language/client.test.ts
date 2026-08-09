import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  isSuccessfulOpenAiLanguageResponse,
  requestCoachLanguage,
} from './client';
import type { CoachGenerateResponse, CoachPromptPayload } from '../../../shared/coach-language';

const samplePayload: CoachPromptPayload = {
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

describe('requestCoachLanguage', () => {
  it('returns not_configured when API URL is missing', async () => {
    const previous = process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;
    delete process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
    });

    assert.deepEqual(result, { ok: false, reason: 'not_configured' });

    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;
    } else {
      process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = previous;
    }
  });

  it('treats timeout as failure so Home keeps template', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:9';

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
      timeoutMs: 20,
      fetchImpl: () =>
        new Promise((_resolve, reject) => {
          const error = new Error('Aborted');
          error.name = 'AbortError';
          setTimeout(() => reject(error), 5);
        }) as Promise<Response>,
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'timeout');
    }
  });

  it('treats OpenAI/server fallback responses as unsuccessful for Home replacement', () => {
    const response: CoachGenerateResponse = {
      message: {
        headline: 'Fallback',
        body: 'Server fallback text',
        recommendedAction: samplePayload.decision.recommendedAction,
        tone: 'neutral',
        promptVersion: 'nordyan-coach-v2',
      },
      meta: {
        provider: 'fallback',
        latencyMs: 10,
        promptVersion: 'nordyan-coach-v2',
        validationStatus: 'fallback',
        usedFallback: true,
        requestId: 'coach_test',
      },
    };

    assert.equal(isSuccessfulOpenAiLanguageResponse(response), false);
  });

  it('accepts valid OpenAI responses for Home replacement', () => {
    const response: CoachGenerateResponse = {
      message: {
        headline: 'Bra riktning',
        body: 'Fortsätt med din promenad efter middagen.',
        recommendedAction: samplePayload.decision.recommendedAction,
        tone: 'encouraging',
        promptVersion: 'nordyan-coach-v2',
      },
      meta: {
        provider: 'openai',
        latencyMs: 120,
        promptVersion: 'nordyan-coach-v2',
        validationStatus: 'valid',
        usedFallback: false,
        requestId: 'coach_ok',
      },
    };

    assert.equal(isSuccessfulOpenAiLanguageResponse(response), true);
  });

  it('maps network/server failures so Home retains template', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:8788';

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
      fetchImpl: async () => {
        throw new Error('network down');
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'network');
    }
  });

  it('maps 429 rate limit so Home retains template (no success path)', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:8788';

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
      fetchImpl: async () => new Response(JSON.stringify({ error: 'Too many requests.' }), { status: 429 }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'rate_limited');
    }
    assert.equal(isSuccessfulOpenAiLanguageResponse({
      message: {
        headline: 'x',
        body: 'y',
        recommendedAction: samplePayload.decision.recommendedAction,
        tone: 'neutral',
        promptVersion: 'nordyan-coach-v2',
      },
      meta: {
        provider: 'fallback',
        latencyMs: 1,
        promptVersion: 'nordyan-coach-v2',
        validationStatus: 'fallback',
        usedFallback: true,
        requestId: 'r',
      },
    }), false);
  });
});
