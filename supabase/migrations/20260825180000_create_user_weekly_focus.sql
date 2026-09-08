-- Weekly Focus assignments: one immutable pair per user per local Monday week.
-- Not Health Score, Focus Engine, Coach Plan, or Daily Focus.

create table if not exists public.user_weekly_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  area_1 text not null,
  area_1_mode text not null,
  area_1_need smallint not null,
  area_2 text not null,
  area_2_mode text not null,
  area_2_need smallint not null,
  recovery_constraint boolean not null,
  engine_version text not null,
  insufficient_evidence_fallback boolean not null default false,
  created_at timestamptz not null default now(),
  constraint user_weekly_focus_user_week_unique unique (user_id, week_start_date),
  constraint user_weekly_focus_area_1_check
    check (
      area_1 in (
        'everyday_movement',
        'training',
        'sleep',
        'nutrition',
        'alcohol',
        'recovery'
      )
    ),
  constraint user_weekly_focus_area_2_check
    check (
      area_2 in (
        'everyday_movement',
        'training',
        'sleep',
        'nutrition',
        'alcohol',
        'recovery'
      )
    ),
  constraint user_weekly_focus_area_1_mode_check
    check (area_1_mode in ('improve', 'maintain')),
  constraint user_weekly_focus_area_2_mode_check
    check (area_2_mode in ('improve', 'maintain')),
  constraint user_weekly_focus_area_1_need_range
    check (area_1_need between 0 and 5),
  constraint user_weekly_focus_area_2_need_range
    check (area_2_need between 0 and 5)
);

create index if not exists user_weekly_focus_user_id_week_start_date_idx
  on public.user_weekly_focus (user_id, week_start_date desc);

alter table public.user_weekly_focus enable row level security;

drop policy if exists "user_weekly_focus_select_own" on public.user_weekly_focus;
create policy "user_weekly_focus_select_own"
on public.user_weekly_focus
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_weekly_focus_insert_own" on public.user_weekly_focus;
create policy "user_weekly_focus_insert_own"
on public.user_weekly_focus
for insert
to authenticated
with check (auth.uid() = user_id);

revoke all on table public.user_weekly_focus from anon;
grant select, insert on table public.user_weekly_focus to authenticated;
