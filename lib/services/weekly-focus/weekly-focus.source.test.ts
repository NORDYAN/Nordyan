import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { describe, it } from 'node:test';

function source(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), 'utf8');
}

const MIGRATION = 'supabase/migrations/20260825180000_create_user_weekly_focus.sql';

describe('Weekly Focus persistence source contracts', () => {
  it('21–22. repository has no update or upsert API', () => {
    const repo = source('lib/repositories/weekly-focus.repository.ts');
    const supabase = source('lib/repositories/supabase-weekly-focus.repository.ts');
    assert.match(repo, /getByUserAndWeek/);
    assert.match(repo, /insert\(/);
    assert.doesNotMatch(repo, /update|upsert|delete/i);
    assert.doesNotMatch(supabase, /\.upsert\(/);
    assert.doesNotMatch(supabase, /\.update\(/);
    assert.doesNotMatch(supabase, /\.delete\(/);
    assert.match(supabase, /\.insert\(/);
  });

  it('23–26. migration RLS, grants, unique index, and cascade', () => {
    const migration = source(MIGRATION);
    assert.match(migration, /create table if not exists public\.user_weekly_focus/);
    assert.match(migration, /references auth\.users \(id\) on delete cascade/);
    assert.match(migration, /user_weekly_focus_user_week_unique unique \(user_id, week_start_date\)/);
    assert.match(
      migration,
      /user_weekly_focus_user_id_week_start_date_idx[\s\S]*week_start_date desc/,
    );
    assert.match(migration, /enable row level security/);
    assert.match(migration, /user_weekly_focus_select_own/);
    assert.match(migration, /user_weekly_focus_insert_own/);
    assert.match(migration, /for select[\s\S]*using \(auth\.uid\(\) = user_id\)/);
    assert.match(migration, /for insert[\s\S]*with check \(auth\.uid\(\) = user_id\)/);
    assert.doesNotMatch(migration, /for update/);
    assert.doesNotMatch(migration, /for delete/);
    assert.doesNotMatch(migration, /grant select, insert, update/);
    assert.match(migration, /revoke all on table public\.user_weekly_focus from anon/);
    assert.match(migration, /grant select, insert on table public\.user_weekly_focus to authenticated/);
  });

  it('does not enumerate the table in Account Deletion implementation', () => {
    const accountDelete = source('lib/services/account-delete/delete-current-account.ts');
    const deleteUser = source('services/account/src/deleteUser.ts');
    assert.doesNotMatch(accountDelete, /user_weekly_focus/);
    assert.doesNotMatch(deleteUser, /user_weekly_focus/);
  });

  it('31. service does not rerun the Health Score Focus Engine', () => {
    const service = source('lib/services/weekly-focus/weekly-focus.service.ts');
    assert.doesNotMatch(service, /determineFocus\(/);
    assert.doesNotMatch(service, /from '@\/lib\/domain\/focus-engine'/);
    assert.match(service, /determineWeeklyFocus/);
    assert.match(service, /snapshotResult\.value\?\.primaryFocus/);
  });

  it('does not change Weekly Focus engine scoring', () => {
    const engine = source('lib/domain/weekly-focus/weekly-focus-engine.ts');
    assert.match(engine, /export function determineWeeklyFocus/);
    assert.doesNotMatch(engine, /getSupabaseClient/);
  });
});
