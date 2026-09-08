import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Database } from '@/lib/supabase/database.types';
import {
  mapWeeklyFocusRow,
  weeklyFocusToInsert,
} from '@/lib/repositories/weekly-focus-mappers';

type WeeklyFocusRow = Database['public']['Tables']['user_weekly_focus']['Row'];

const validRow: WeeklyFocusRow = {
  id: 'focus-1',
  user_id: 'user-1',
  week_start_date: '2026-08-31',
  area_1: 'sleep',
  area_1_mode: 'improve',
  area_1_need: 5,
  area_2: 'everyday_movement',
  area_2_mode: 'maintain',
  area_2_need: 0,
  recovery_constraint: false,
  engine_version: '1.0.0',
  insufficient_evidence_fallback: false,
  created_at: '2026-08-31T08:00:00.000Z',
};

describe('weekly focus row mapping', () => {
  it('maps a valid row without reordering areas', () => {
    const mapped = mapWeeklyFocusRow(validRow);
    assert.ok(mapped);
    assert.equal(mapped?.focuses[0]?.area, 'sleep');
    assert.equal(mapped?.focuses[1]?.area, 'everyday_movement');
  });

  it('29. rejects unknown area/mode/need instead of inventing a valid assignment', () => {
    assert.equal(mapWeeklyFocusRow({ ...validRow, area_1: 'hydration' }), null);
    assert.equal(mapWeeklyFocusRow({ ...validRow, area_1_mode: 'challenge' }), null);
    assert.equal(mapWeeklyFocusRow({ ...validRow, area_1_need: 6 }), null);
    assert.equal(mapWeeklyFocusRow({ ...validRow, area_2_need: -1 }), null);
  });

  it('preserves engine order on insert payload', () => {
    const payload = weeklyFocusToInsert({
      userId: 'user-1',
      weekStartDate: '2026-08-31',
      focuses: [
        { area: 'nutrition', mode: 'improve', needScore: 4 },
        { area: 'sleep', mode: 'maintain', needScore: 1 },
      ],
      recoveryConstraint: false,
      engineVersion: '1.0.0',
      insufficientEvidenceFallback: false,
    });
    assert.equal(payload.area_1, 'nutrition');
    assert.equal(payload.area_2, 'sleep');
  });
});
