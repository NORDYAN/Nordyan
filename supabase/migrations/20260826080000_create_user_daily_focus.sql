-- Daily Focus assignments: one controlled-mutable row per user per local calendar date.
-- Not Weekly Focus, Health Score, Coach, or Action Bank rows.

create table if not exists public.user_daily_focus (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  local_date date not null,
  week_start_date date not null,
  action_id text not null,
  focus_area text not null,
  weekly_mode text not null,
  intensity text not null,
  behavior_family text not null,
  completed_at timestamptz null,
  swap_count smallint not null default 0,
  swapped_from_action_id text null,
  swapped_from_behavior_family text null,
  swapped_from_focus_area text null,
  swapped_from_intensity text null,
  action_bank_version text not null,
  selector_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_daily_focus_user_date_unique unique (user_id, local_date),
  constraint user_daily_focus_focus_area_check
    check (
      focus_area in (
        'everyday_movement',
        'training',
        'sleep',
        'nutrition',
        'alcohol',
        'recovery'
      )
    ),
  constraint user_daily_focus_weekly_mode_check
    check (weekly_mode in ('improve', 'maintain')),
  constraint user_daily_focus_intensity_check
    check (intensity in ('micro', 'normal', 'challenge', 'recovery')),
  constraint user_daily_focus_swap_count_check
    check (swap_count in (0, 1)),
  constraint user_daily_focus_swap_snapshot_check
    check (
      (
        swap_count = 0
        and swapped_from_action_id is null
        and swapped_from_behavior_family is null
        and swapped_from_focus_area is null
        and swapped_from_intensity is null
      )
      or (
        swap_count = 1
        and swapped_from_action_id is not null
        and swapped_from_behavior_family is not null
        and swapped_from_focus_area is not null
        and swapped_from_intensity is not null
      )
    ),
  constraint user_daily_focus_swapped_from_focus_area_check
    check (
      swapped_from_focus_area is null
      or swapped_from_focus_area in (
        'everyday_movement',
        'training',
        'sleep',
        'nutrition',
        'alcohol',
        'recovery'
      )
    ),
  constraint user_daily_focus_swapped_from_intensity_check
    check (
      swapped_from_intensity is null
      or swapped_from_intensity in ('micro', 'normal', 'challenge', 'recovery')
    )
);

create index if not exists user_daily_focus_user_id_week_start_date_idx
  on public.user_daily_focus (user_id, week_start_date);

create or replace function public.user_daily_focus_before_update()
returns trigger
language plpgsql
as $$
begin
  if new.id is distinct from old.id
    or new.user_id is distinct from old.user_id
    or new.local_date is distinct from old.local_date
    or new.week_start_date is distinct from old.week_start_date
    or new.created_at is distinct from old.created_at
    or new.action_bank_version is distinct from old.action_bank_version
    or new.selector_version is distinct from old.selector_version then
    raise exception 'user_daily_focus identity fields are immutable';
  end if;

  if new.swap_count < old.swap_count then
    raise exception 'user_daily_focus swap_count cannot decrease';
  end if;

  if old.swap_count = 0 and new.swap_count = 0 then
    if new.action_id is distinct from old.action_id
      or new.focus_area is distinct from old.focus_area
      or new.weekly_mode is distinct from old.weekly_mode
      or new.intensity is distinct from old.intensity
      or new.behavior_family is distinct from old.behavior_family
      or new.swapped_from_action_id is distinct from old.swapped_from_action_id
      or new.swapped_from_behavior_family is distinct from old.swapped_from_behavior_family
      or new.swapped_from_focus_area is distinct from old.swapped_from_focus_area
      or new.swapped_from_intensity is distinct from old.swapped_from_intensity then
      raise exception 'user_daily_focus assignment is immutable without a legal swap';
    end if;
  elsif old.swap_count = 0 and new.swap_count = 1 then
    if old.completed_at is not null or new.completed_at is not null then
      raise exception 'user_daily_focus cannot swap a completed assignment';
    end if;
    if new.swapped_from_action_id is distinct from old.action_id
      or new.swapped_from_behavior_family is distinct from old.behavior_family
      or new.swapped_from_focus_area is distinct from old.focus_area
      or new.swapped_from_intensity is distinct from old.intensity then
      raise exception 'user_daily_focus swap snapshot must match the original assignment';
    end if;
    if new.action_id is not distinct from old.action_id
      or new.behavior_family is not distinct from old.behavior_family then
      raise exception 'user_daily_focus swap replacement must differ in action and family';
    end if;
  elsif old.swap_count = 1 and new.swap_count = 1 then
    if new.action_id is distinct from old.action_id
      or new.focus_area is distinct from old.focus_area
      or new.weekly_mode is distinct from old.weekly_mode
      or new.intensity is distinct from old.intensity
      or new.behavior_family is distinct from old.behavior_family
      or new.swapped_from_action_id is distinct from old.swapped_from_action_id
      or new.swapped_from_behavior_family is distinct from old.swapped_from_behavior_family
      or new.swapped_from_focus_area is distinct from old.swapped_from_focus_area
      or new.swapped_from_intensity is distinct from old.swapped_from_intensity then
      raise exception 'user_daily_focus assignment is immutable after swap';
    end if;
  end if;

  if old.completed_at is null and new.completed_at is not null then
    new.completed_at = now();
  end if;

  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_daily_focus_before_update on public.user_daily_focus;
create trigger user_daily_focus_before_update
before update on public.user_daily_focus
for each row
execute function public.user_daily_focus_before_update();

alter table public.user_daily_focus enable row level security;

drop policy if exists "user_daily_focus_select_own" on public.user_daily_focus;
create policy "user_daily_focus_select_own"
on public.user_daily_focus
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "user_daily_focus_insert_own" on public.user_daily_focus;
create policy "user_daily_focus_insert_own"
on public.user_daily_focus
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "user_daily_focus_update_own" on public.user_daily_focus;
create policy "user_daily_focus_update_own"
on public.user_daily_focus
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on table public.user_daily_focus from anon;
grant select, insert, update on table public.user_daily_focus to authenticated;
