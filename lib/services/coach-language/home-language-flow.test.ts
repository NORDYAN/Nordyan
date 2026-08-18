import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, beforeEach } from 'node:test';
import { fileURLToPath } from 'node:url';

import { runCoachVectorTests } from '../../domain/coach-engine/coach-engine.test-vectors';
import { getLocalizedCoachPresentation, setActiveLocale } from '../../i18n';
import { adaptCoachEngineResultToLanguagePayload } from './adapter';
import {
  isSuccessfulOpenAiLanguageResponse,
  requestCoachLanguage,
} from './client';
import { getCoachLanguageApiBaseUrl, isCoachLanguageApiConfigured } from './env';
import { isHomeCoachGeneratedLocaleSupported } from './locale';
import {
  buildCoachLanguageCacheKey,
  clearCoachLanguageSessionCache,
  getCachedCoachLanguageMessage,
  setCachedCoachLanguageMessage,
} from './sessionCache';
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

const openaiSuccess: CoachGenerateResponse = {
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

describe('Home coach language flow contracts', () => {
  beforeEach(() => {
    clearCoachLanguageSessionCache();
    setActiveLocale('sv');
  });

  it('does not call language service when access token is missing (logged out)', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:8788';
    let fetchCalls = 0;

    const result = await requestCoachLanguage({
      accessToken: '',
      payload: samplePayload,
      fetchImpl: async () => {
        fetchCalls += 1;
        return new Response('{}', { status: 200 });
      },
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'unauthorized');
    }
    assert.equal(fetchCalls, 0);
  });

  it('treats OpenAI error-shaped rejections so Home retains template', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:8788';

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
      fetchImpl: async () => new Response(JSON.stringify({ error: 'fail' }), { status: 500 }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'rejected');
    }
    assert.equal(isSuccessfulOpenAiLanguageResponse(openaiSuccess), true);
  });

  it('treats invalid model output shape as unsuccessful for Home', async () => {
    process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = 'http://127.0.0.1:8788';

    const result = await requestCoachLanguage({
      accessToken: 'token',
      payload: samplePayload,
      fetchImpl: async () =>
        new Response(JSON.stringify({ meta: { provider: 'openai' } }), { status: 200 }),
    });

    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.reason, 'invalid');
    }
  });

  it('OpenAI success is the only path that replaces template copy', () => {
    const serverFallback: CoachGenerateResponse = {
      ...openaiSuccess,
      meta: {
        ...openaiSuccess.meta,
        provider: 'fallback',
        validationStatus: 'fallback',
        usedFallback: true,
      },
    };

    assert.equal(isSuccessfulOpenAiLanguageResponse(openaiSuccess), true);
    assert.equal(isSuccessfulOpenAiLanguageResponse(serverFallback), false);
  });

  it('duplicate Home recommendation reuses session cache (no second network needed)', () => {
    const key = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });

    setCachedCoachLanguageMessage(key, 'Cachat AI-meddelande');
    assert.equal(getCachedCoachLanguageMessage(key), 'Cachat AI-meddelande');
  });

  it('does not retry the same recommendation after a completed failed attempt', async () => {
    const {
      hasCompletedCoachLanguageAttempt,
      markCoachLanguageAttemptComplete,
    } = await import('./sessionCache');

    const key = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });

    markCoachLanguageAttemptComplete(key);
    assert.equal(hasCompletedCoachLanguageAttempt(key), true);
    assert.equal(getCachedCoachLanguageMessage(key), null);
  });

  it('Home template path does not require language API configuration', () => {
    const previous = process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;
    delete process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;

    assert.equal(isCoachLanguageApiConfigured(), false);
    assert.equal(getCoachLanguageApiBaseUrl(), null);

    if (previous === undefined) {
      delete process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL;
    } else {
      process.env.EXPO_PUBLIC_COACH_LANGUAGE_API_URL = previous;
    }
  });

  it('Home screen shows template before language hook result (source contract)', () => {
    const homePath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../../app/(tabs)/home.tsx',
    );
    const source = readFileSync(homePath, 'utf8');

    assert.match(source, /templateCoachMessage/);
    assert.match(source, /useHomeCoachLanguage/);
    assert.match(source, /templateMessage:\s*templateCoachMessage/);
    // Language URL must not gate Home readiness.
    assert.doesNotMatch(source, /EXPO_PUBLIC_COACH_LANGUAGE_API_URL/);
    assert.doesNotMatch(source, /OPENAI_API_KEY/);
  });

  it('identifies Home /generate as Swedish-only and uses Bokmål deterministic copy', () => {
    const adapted = adaptCoachEngineResultToLanguagePayload({
      recommendationId: 'waist_walk_after_dinner_v1',
      category: 'walking',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      priority: 'medium',
      confidence: 0.7,
      primaryFocus: 'reduce_waist',
    });

    assert.equal(adapted.ok, true);
    if (adapted.ok) {
      assert.equal(adapted.payload.version, 'coach-simulator-v2');
      assert.equal(adapted.payload.locale, 'sv-SE');
    }
    assert.equal(isHomeCoachGeneratedLocaleSupported('sv'), true);
    assert.equal(isHomeCoachGeneratedLocaleSupported('nb'), false);

    setActiveLocale('nb');
    const deterministic = getLocalizedCoachPresentation(
      'waist_walk_after_dinner_v1',
      30,
      4,
    );
    assert.equal(deterministic.title, 'Gåtur etter middagen');
    assert.match(deterministic.description, /Gå 30 minutter etter middagen/);
  });

  it('does not show cached Swedish /generate copy while the UI locale is nb', () => {
    const hookPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../hooks/home/useHomeCoachLanguage.ts',
    );
    const source = readFileSync(hookPath, 'utf8');

    assert.match(source, /isHomeCoachGeneratedLocaleSupported\(locale\)/);
    assert.match(source, /if \(!generatedLanguageEnabled \|\| !source \|\| silence\)/);
    assert.match(source, /setAiMessage\(null\)/);
  });

  it('coach-engine vectors remain unchanged', () => {
    const result = runCoachVectorTests();
    assert.equal(result.failed, 0, result.failures.join('\n'));
    assert.ok(result.passed >= 27);
  });
});
