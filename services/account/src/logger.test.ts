import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createRequestId, logAccountRequest } from './logger';

describe('logAccountRequest', () => {
  it('emits metadata-only JSON without tokens, emails, or user ids', () => {
    const lines: string[] = [];
    const original = console.info;
    console.info = (value: unknown) => {
      lines.push(String(value));
    };

    const previous = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    try {
      logAccountRequest({
        requestId: 'account_test',
        latencyMs: 12,
        category: 'success',
        alreadyDeleted: false,
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
      'alreadyDeleted',
      'category',
      'event',
      'latencyMs',
      'requestId',
    ]);
    assert.equal(parsed.event, 'account.delete');
    assert.equal('userId' in parsed, false);
    assert.equal('user_id' in parsed, false);
    assert.equal('email' in parsed, false);
    assert.equal('token' in parsed, false);
    assert.equal('accessToken' in parsed, false);
  });

  it('creates opaque request ids without embedding a user uuid', () => {
    assert.match(createRequestId(), /^account_[a-z0-9]+_[a-z0-9]+$/i);
    assert.doesNotMatch(createRequestId(), /[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });
});
