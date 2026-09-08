import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const MIGRATION = 'supabase/migrations/20260826080000_create_user_daily_focus.sql';

describe('Daily Focus persistence source contracts', () => {
  it('47–58. migration unique, cascade, RLS, grants, trigger, swap constraints', () => {
    const migration = source(MIGRATION);
    assert.match(migration, /create table if not exists public\.user_daily_focus/);
    assert.match(migration, /references auth\.users \(id\) on delete cascade/);
    assert.match(migration, /user_daily_focus_user_date_unique unique \(user_id, local_date\)/);
    assert.match(migration, /user_daily_focus_user_id_week_start_date_idx/);
    assert.doesNotMatch(migration, /references public\.user_weekly_focus/);
    assert.match(migration, /enable row level security/);
    assert.match(migration, /user_daily_focus_select_own/);
    assert.match(migration, /user_daily_focus_insert_own/);
    assert.match(migration, /user_daily_focus_update_own/);
    assert.match(migration, /for select[\s\S]*using \(auth\.uid\(\) = user_id\)/);
    assert.match(migration, /for insert[\s\S]*with check \(auth\.uid\(\) = user_id\)/);
    assert.match(migration, /for update[\s\S]*using \(auth\.uid\(\) = user_id\)/);
    assert.doesNotMatch(migration, /for delete/);
    assert.match(migration, /revoke all on table public\.user_daily_focus from anon/);
    assert.match(migration, /grant select, insert, update on table public\.user_daily_focus to authenticated/);
    assert.match(migration, /swap_count in \(0, 1\)/);
    assert.match(migration, /user_daily_focus_swap_snapshot_check/);
    assert.match(migration, /user_daily_focus identity fields are immutable/);
    assert.match(migration, /assignment is immutable after swap/);
    assert.match(migration, /cannot swap a completed assignment/);
    assert.match(migration, /new\.updated_at = now\(\)/);
    assert.match(migration, /new\.completed_at = now\(\)/);
  });

  it('13. repository has no upsert or delete', () => {
    const repo = source('lib/repositories/daily-focus.repository.ts');
    const supabase = source('lib/repositories/supabase-daily-focus.repository.ts');
    assert.match(repo, /getByUserAndDate/);
    assert.match(repo, /getHistoryRange/);
    assert.match(repo, /insert\(/);
    assert.match(repo, /swapIfAvailable/);
    assert.doesNotMatch(repo, /upsert|delete/i);
    assert.doesNotMatch(supabase, /\.upsert\(/);
    assert.doesNotMatch(supabase, /\.delete\(/);
  });

  it('64. does not enumerate the table in Account Deletion implementation', () => {
    const accountDelete = source('lib/services/account-delete/delete-current-account.ts');
    const deleteUser = source('services/account/src/deleteUser.ts');
    assert.doesNotMatch(accountDelete, /user_daily_focus/);
    assert.doesNotMatch(deleteUser, /user_daily_focus/);
  });

  it('62–63. Action Bank and selector ranking files are not rewritten by persistence', () => {
    const bank = source('lib/domain/daily-focus/daily-focus-action-definitions.ts');
    const selector = source('lib/domain/daily-focus/daily-focus-selector.ts');
    assert.doesNotMatch(bank, /user_daily_focus/);
    assert.doesNotMatch(selector, /getSupabaseClient/);
    assert.match(selector, /export function selectDailyFocus/);
  });

  it('65. service reuses Monday and local-date helpers', () => {
    const service = source('lib/services/daily-focus/daily-focus.service.ts');
    assert.match(service, /getWeeklyCheckInWeekStartDate/);
    assert.match(service, /getPreviousWeeklyCheckInWeekStartDate/);
    assert.match(service, /getLocalCalendarDate/);
    assert.match(service, /addDailyFocusCalendarDays/);
    assert.match(service, /selectionSeed: input\.userId|selectionSeed: userId/);
    assert.doesNotMatch(service, /av 7/);
    assert.doesNotMatch(service, /AsyncStorage/);
  });
});
