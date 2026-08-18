import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRequestId, logCoachRequest } from './logger';

describe('logCoachRequest', () => {
  it('emits metadata-only JSON without health or body-fat payload fields', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (value: unknown) => {
      lines.push(String(value));
    };

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      logCoachRequest({
        requestId: 'coach_test',
        promptVersion: 'nordyan-coach-ask-v1.4',
        provider: 'openai',
        latencyMs: 12,
        category: 'success',
        usedFallback: false,
        endpoint: 'ask',
      });
    } finally {
      console.info = original;
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }

    assert.equal(lines.length, 1);
    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    assert.deepEqual(Object.keys(parsed).sort(), [
      'category',
      'endpoint',
      'event',
      'latencyMs',
      'promptVersion',
      'provider',
      'requestId',
      'usedFallback',
    ]);
    assert.equal('bodyFatPercent' in parsed, false);
    assert.equal('ageBand' in parsed, false);
    assert.equal('sex' in parsed, false);
    assert.equal('dateOfBirth' in parsed, false);
    assert.equal('bodyFatReference' in parsed, false);
    assert.equal('referenceMedianPercent' in parsed, false);
    assert.equal('question' in parsed, false);
    assert.equal(typeof createRequestId(), 'string');
  });

  it('can include OpenAI completion metadata without answer text', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (value: unknown) => {
      lines.push(String(value));
    };

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      logCoachRequest({
        requestId: 'coach_test',
        promptVersion: 'nordyan-coach-ask-v1.5',
        provider: 'openai',
        latencyMs: 18,
        category: 'success',
        usedFallback: false,
        endpoint: 'ask',
        openaiStatus: 'completed',
        outputTokenCount: 96,
        answerCharCount: 240,
        retryAttempt: 0,
      });
    } finally {
      console.info = original;
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }

    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    assert.equal(parsed.openaiStatus, 'completed');
    assert.equal(parsed.outputTokenCount, 96);
    assert.equal(parsed.answerCharCount, 240);
    assert.equal(parsed.retryAttempt, 0);
    assert.equal('answer' in parsed, false);
    assert.equal('question' in parsed, false);
    assert.equal('output_text' in parsed, false);
    assert.equal('userId' in parsed, false);
    assert.equal('jwt' in parsed, false);
    assert.equal('context' in parsed, false);
  });

  it('can include retry and completeness metadata without payloads', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (value: unknown) => {
      lines.push(String(value));
    };

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      logCoachRequest({
        requestId: 'coach_test',
        promptVersion: 'nordyan-coach-ask-v1.5',
        provider: 'fallback',
        latencyMs: 22,
        category: 'openai_error',
        usedFallback: true,
        endpoint: 'ask',
        openaiStatus: 'completed',
        completenessReason: 'mid_word',
        outputTokenCount: 122,
        answerCharCount: 452,
        retryAttempt: 1,
      });
    } finally {
      console.info = original;
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }

    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    assert.equal(parsed.retryAttempt, 1);
    assert.equal(parsed.completenessReason, 'mid_word');
    assert.equal(parsed.usedFallback, true);
    assert.equal('answer' in parsed, false);
    assert.equal('question' in parsed, false);
    assert.equal('healthState' in parsed, false);
    assert.equal('userId' in parsed, false);
    assert.equal('JWT' in parsed, false);
  });

  it('may include Ask locale as non-health request metadata', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (value: unknown) => {
      lines.push(String(value));
    };

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      logCoachRequest({
        requestId: 'coach_test',
        promptVersion: 'nordyan-coach-ask-v1.6',
        provider: 'openai',
        latencyMs: 14,
        category: 'success',
        usedFallback: false,
        endpoint: 'ask',
        locale: 'nb-NO',
        requestVersion: 'coach-ask-v1.6',
        model: 'gpt-4o-mini',
        responseSource: 'ai',
      });
    } finally {
      console.info = original;
      if (previous === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previous;
      }
    }

    const parsed = JSON.parse(lines[0] ?? '{}') as Record<string, unknown>;
    assert.equal(parsed.locale, 'nb-NO');
    assert.equal(parsed.requestVersion, 'coach-ask-v1.6');
    assert.equal(parsed.promptVersion, 'nordyan-coach-ask-v1.6');
    assert.equal(parsed.model, 'gpt-4o-mini');
    assert.equal(parsed.responseSource, 'ai');
    assert.equal('question' in parsed, false);
    assert.equal('answer' in parsed, false);
    assert.equal('healthState' in parsed, false);
    assert.equal('bodyFatPercent' in parsed, false);
    assert.equal('ageBand' in parsed, false);
    assert.equal('sex' in parsed, false);
  });
});
