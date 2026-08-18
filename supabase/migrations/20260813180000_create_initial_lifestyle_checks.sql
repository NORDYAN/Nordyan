-- Initial Lifestyle Checks: one current self-reported baseline row per user.
-- Typical / normal lifestyle, not a weekly event.
-- Not a Health Score input, snapshot, measurement, or device reading.
-- No row = skipped / not completed. Existing row = complete seven-answer baseline.

create table if not exists public.initial_lifestyle_checks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sleep_quality smallint not null,
  energy smallint not null,
  stress smallint not null,
  training_frequency text not null,
  everyday_activity smallint not null,
  eating_quality smallint not null,
  alcohol_consumption text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint initial_lifestyle_checks_user_id_unique unique (user_id),
  constraint initial_lifestyle_checks_sleep_quality_range
    check (sleep_quality between 1 and 5),
  constraint initial_lifestyle_checks_energy_range
    check (energy between 1 and 5),
  constraint initial_lifestyle_checks_stress_range
    check (stress between 1 and 5),
  constraint initial_lifestyle_checks_everyday_activity_range
    check (everyday_activity between 1 and 5),
  constraint initial_lifestyle_checks_eating_quality_range
    check (eating_quality between 1 and 5),
  constraint initial_lifestyle_checks_training_frequency_check
    check (
      training_frequency in (
        'none',
        'once',
        'twice',
        'three',
        'four_plus'
      )
    ),
  constraint initial_lifestyle_checks_alcohol_consumption_check
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

create or replace function public.set_initial_lifestyle_checks_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists initial_lifestyle_checks_set_updated_at on public.initial_lifestyle_checks;
create trigger initial_lifestyle_checks_set_updated_at
before update on public.initial_lifestyle_checks
for each row
execute function public.set_initial_lifestyle_checks_updated_at();

alter table public.initial_lifestyle_checks enable row level security;

drop policy if exists "initial_lifestyle_checks_select_own" on public.initial_lifestyle_checks;
create policy "initial_lifestyle_checks_select_own"
on public.initial_lifestyle_checks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "initial_lifestyle_checks_insert_own" on public.initial_lifestyle_checks;
create policy "initial_lifestyle_checks_insert_own"
on public.initial_lifestyle_checks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "initial_lifestyle_checks_update_own" on public.initial_lifestyle_checks;
create policy "initial_lifestyle_checks_update_own"
on public.initial_lifestyle_checks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on table public.initial_lifestyle_checks from anon;
grant select, insert, update on table public.initial_lifestyle_checks to authenticated;
