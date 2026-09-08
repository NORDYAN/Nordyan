import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { toHomeWeeklyFocusStatus } from './home-weekly-focus.presentation';
import type { HomeWeeklyFocusData } from '@/lib/services/weekly-focus';

const data: HomeWeeklyFocusData = {
  weekStartDate: '2026-08-31',
  focuses: [
    { area: 'sleep', mode: 'improve', needScore: 5 },
    { area: 'everyday_movement', mode: 'maintain', needScore: 0 },
  ],
  recoveryConstraint: true,
  engineVersion: '1.0.0',
  insufficientEvidenceFallback: false,
};

describe('toHomeWeeklyFocusStatus', () => {
  it('maps ready, not_ready, unavailable, and transport errors', () => {
    assert.deepEqual(toHomeWeeklyFocusStatus({ ok: true, value: { status: 'ready', data } }), {
      status: 'ready',
      data,
    });
    assert.deepEqual(toHomeWeeklyFocusStatus({ ok: true, value: { status: 'not_ready' } }), {
      status: 'loading',
    });
    assert.deepEqual(toHomeWeeklyFocusStatus({ ok: true, value: { status: 'unavailable' } }), {
      status: 'unavailable',
    });
    assert.deepEqual(
      toHomeWeeklyFocusStatus({ ok: false, error: { code: 'NETWORK', message: 'offline' } }),
      { status: 'unavailable' },
    );
  });
});
