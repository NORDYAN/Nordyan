import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';

import {
  buildCoachLanguageCacheKey,
  clearCoachLanguageSessionCache,
  getCachedCoachLanguageMessage,
  getInflightCoachLanguageRequest,
  hasCompletedCoachLanguageAttempt,
  markCoachLanguageAttemptComplete,
  setCachedCoachLanguageMessage,
  setInflightCoachLanguageRequest,
} from './sessionCache';

describe('coach language session cache', () => {
  beforeEach(() => {
    clearCoachLanguageSessionCache();
  });

  it('reuses the same key for identical recommendation state', () => {
    const a = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });
    const b = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });
    assert.equal(a, b);
  });

  it('does not reuse cache across different recommendation state', () => {
    const a = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });
    const b = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 45,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });
    assert.notEqual(a, b);
  });

  it('stores formulated messages for the session only', () => {
    const key = buildCoachLanguageCacheKey({
      recommendationId: 'r1',
      durationMinutes: 20,
      frequencyPerWeek: 3,
      primaryFocus: 'improve_cardio',
    });

    assert.equal(getCachedCoachLanguageMessage(key), null);
    setCachedCoachLanguageMessage(key, 'Formulerat meddelande.');
    assert.equal(getCachedCoachLanguageMessage(key), 'Formulerat meddelande.');
  });

  it('deduplicates in-flight requests for the same key', async () => {
    const key = 'same-key';
    let calls = 0;

    const shared = (async () => {
      calls += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'ok';
    })();

    setInflightCoachLanguageRequest(key, shared);
    const first = getInflightCoachLanguageRequest(key);
    const second = getInflightCoachLanguageRequest(key);

    assert.equal(first, second);
    assert.equal(await first, 'ok');
    assert.equal(calls, 1);
    // Cleared after settle
    await new Promise((resolve) => setTimeout(resolve, 0));
    assert.equal(getInflightCoachLanguageRequest(key), undefined);
  });

  it('marks failed attempts complete so Home does not retry-storm', () => {
    const key = buildCoachLanguageCacheKey({
      recommendationId: 'waist_walk_after_dinner_v1',
      durationMinutes: 30,
      frequencyPerWeek: 4,
      primaryFocus: 'reduce_waist',
    });

    assert.equal(hasCompletedCoachLanguageAttempt(key), false);
    markCoachLanguageAttemptComplete(key);
    assert.equal(hasCompletedCoachLanguageAttempt(key), true);
    assert.equal(getCachedCoachLanguageMessage(key), null);
  });
});
