import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createMemoryRateLimiter } from './rateLimit';

describe('createMemoryRateLimiter', () => {
  it('allows up to maxPerMinute then rejects', () => {
    const limiter = createMemoryRateLimiter({ maxPerMinute: 2, maxPerDay: 100 });
    const t0 = Date.UTC(2026, 7, 8, 12, 0, 10);

    assert.equal(limiter.check('user-a', t0).ok, true);
    assert.equal(limiter.check('user-a', t0 + 1000).ok, true);
    assert.deepEqual(limiter.check('user-a', t0 + 2000), {
      ok: false,
      reason: 'per_minute',
    });
  });

  it('scopes limits per authenticated user', () => {
    const limiter = createMemoryRateLimiter({ maxPerMinute: 1, maxPerDay: 100 });
    const now = Date.UTC(2026, 7, 8, 12, 0, 0);

    assert.equal(limiter.check('user-a', now).ok, true);
    assert.equal(limiter.check('user-b', now).ok, true);
    assert.equal(limiter.check('user-a', now + 1).ok, false);
  });

  it('enforces maxPerDay across minute windows', () => {
    const limiter = createMemoryRateLimiter({ maxPerMinute: 10, maxPerDay: 2 });
    const day = Date.UTC(2026, 7, 8, 10, 0, 0);

    assert.equal(limiter.check('user-a', day).ok, true);
    assert.equal(limiter.check('user-a', day + 61_000).ok, true);
    assert.deepEqual(limiter.check('user-a', day + 122_000), {
      ok: false,
      reason: 'per_day',
    });
  });
});
