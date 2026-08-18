-- Weekly Check-ins: one self-reported row per user per local Monday-start week.
-- Not a Health Score input, snapshot, measurement, or device reading.

create table if not exists public.weekly_check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  week_start_date date not null,
  sleep_quality smallint not null,
  energy smallint not null,
  stress smallint not null,
  training_frequency text not null,
  everyday_activity smallint not null,
  eating_quality smallint not null,
  alcohol_consumption text not null,
  plan_adherence smallint not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint weekly_check_ins_user_week_unique unique (user_id, week_start_date),
  constraint weekly_check_ins_sleep_quality_range
    check (sleep_quality between 1 and 5),
  constraint weekly_check_ins_energy_range
    check (energy between 1 and 5),
  constraint weekly_check_ins_stress_range
    check (stress between 1 and 5),
  constraint weekly_check_ins_everyday_activity_range
    check (everyday_activity between 1 and 5),
  constraint weekly_check_ins_eating_quality_range
    check (eating_quality between 1 and 5),
  constraint weekly_check_ins_plan_adherence_range
    check (plan_adherence between 1 and 5),
  constraint weekly_check_ins_training_frequency_check
    check (
      training_frequency in (
        'none',
        'once',
        'twice',
        'three',
        'four_plus'
      )
    ),
  constraint weekly_check_ins_alcohol_consumption_check
    check (
      alcohol_consumption in (
        'none',
        '1_3',
        '4_7',
        '8_14',
        '15_plus'
      )
    )
);

create index if not exists weekly_check_ins_user_id_week_start_date_idx
  on public.weekly_check_ins (user_id, week_start_date desc);

create or replace function public.set_weekly_check_ins_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists weekly_check_ins_set_updated_at on public.weekly_check_ins;
create trigger weekly_check_ins_set_updated_at
before update on public.weekly_check_ins
for each row
execute function public.set_weekly_check_ins_updated_at();

alter table public.weekly_check_ins enable row level security;

drop policy if exists "weekly_check_ins_select_own" on public.weekly_check_ins;
create policy "weekly_check_ins_select_own"
on public.weekly_check_ins
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "weekly_check_ins_insert_own" on public.weekly_check_ins;
create policy "weekly_check_ins_insert_own"
on public.weekly_check_ins
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "weekly_check_ins_update_own" on public.weekly_check_ins;
create policy "weekly_check_ins_update_own"
on public.weekly_check_ins
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on table public.weekly_check_ins from anon;
grant select, insert, update on table public.weekly_check_ins to authenticated;
