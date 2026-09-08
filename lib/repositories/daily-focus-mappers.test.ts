import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  DAILY_FOCUS_ACTION_BANK_VERSION,
  DAILY_FOCUS_SELECTOR_VERSION,
} from '@/lib/domain/daily-focus';
import {
  dailyFocusToInsert,
  mapDailyFocusRow,
  toDailyFocusHistoryEntry,
} from '@/lib/repositories/daily-focus-mappers';
import type { InsertDailyFocusInput } from '@/lib/repositories/daily-focus.repository';
import type { Database } from '@/lib/supabase/database.types';

type DailyFocusRow = Database['public']['Tables']['user_daily_focus']['Row'];

const baseInsert: InsertDailyFocusInput = {
  userId: 'user-1',
  localDate: '2026-03-02',
  weekStartDate: '2026-03-02',
  actionId: 'sleep_prepare_bedroom',
  focusArea: 'sleep',
  weeklyMode: 'improve',
  intensity: 'micro',
  behaviorFamily: 'bedroom_prep',
  actionBankVersion: DAILY_FOCUS_ACTION_BANK_VERSION,
  selectorVersion: DAILY_FOCUS_SELECTOR_VERSION,
};

function row(overrides: Partial<DailyFocusRow> = {}): DailyFocusRow {
  const insert = dailyFocusToInsert(baseInsert);
  return {
    id: 'df-1',
    user_id: insert.user_id,
    local_date: insert.local_date,
    week_start_date: insert.week_start_date,
    action_id: insert.action_id,
    focus_area: insert.focus_area,
    weekly_mode: insert.weekly_mode,
    intensity: insert.intensity,
    behavior_family: insert.behavior_family,
    completed_at: null,
    swap_count: 0,
    swapped_from_action_id: null,
    swapped_from_behavior_family: null,
    swapped_from_focus_area: null,
    swapped_from_intensity: null,
    action_bank_version: insert.action_bank_version,
    selector_version: insert.selector_version,
    created_at: '2026-03-02T08:00:00.000Z',
    updated_at: '2026-03-02T08:00:00.000Z',
    ...overrides,
  };
}

describe('Daily Focus mappers', () => {
  it('maps a valid unswapped row', () => {
    const mapped = mapDailyFocusRow(row());
    assert.equal(mapped?.actionId, 'sleep_prepare_bedroom');
    assert.equal(mapped?.swapCount, 0);
    assert.equal(mapped?.swappedFromActionId, null);
  });

  it('maps swap snapshot onto selector history', () => {
    const mapped = mapDailyFocusRow(
      row({
        action_id: 'nutrition_add_vegetables',
        focus_area: 'nutrition',
        intensity: 'micro',
        behavior_family: 'vegetables',
        swap_count: 1,
        swapped_from_action_id: 'sleep_prepare_bedroom',
        swapped_from_behavior_family: 'bedroom_prep',
        swapped_from_focus_area: 'sleep',
        swapped_from_intensity: 'micro',
      }),
    );
    assert.ok(mapped);
    const history = toDailyFocusHistoryEntry(mapped);
    assert.equal(history.actionId, 'nutrition_add_vegetables');
    assert.equal(history.behaviorFamily, 'vegetables');
    assert.equal(history.swappedFromActionId, 'sleep_prepare_bedroom');
    assert.equal(history.swappedFromBehaviorFamily, 'bedroom_prep');
    assert.equal(history.swappedFromFocusArea, 'sleep');
    assert.equal(history.swappedFromIntensity, 'micro');
  });

  it('keeps unknown action_id if other fields are valid', () => {
    const mapped = mapDailyFocusRow(row({ action_id: 'retired_unknown_action' }));
    assert.equal(mapped?.actionId, 'retired_unknown_action');
  });

  it('rejects invalid focus_area', () => {
    assert.equal(mapDailyFocusRow(row({ focus_area: 'steps' })), null);
  });

  it('rejects incoherent swap snapshot', () => {
    assert.equal(mapDailyFocusRow(row({ swap_count: 1 })), null);
    assert.equal(
      mapDailyFocusRow(row({ swap_count: 0, swapped_from_action_id: 'sleep_prepare_bedroom' })),
      null,
    );
  });
});
