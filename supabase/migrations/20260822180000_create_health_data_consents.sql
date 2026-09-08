-- Health Data Consent v1: versioned, withdrawable grants.
-- No historical consent is backfilled.

create table if not exists public.health_data_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted_at timestamptz not null,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint health_data_consents_type_check
    check (consent_type = 'health_lifestyle_processing'),
  constraint health_data_consents_withdrawn_after_granted
    check (withdrawn_at is null or withdrawn_at >= granted_at)
);

create unique index if not exists health_data_consents_active_unique
  on public.health_data_consents (user_id, consent_type, policy_version)
  where withdrawn_at is null;

create or replace function public.set_health_data_consents_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists health_data_consents_set_updated_at on public.health_data_consents;
create trigger health_data_consents_set_updated_at
before update on public.health_data_consents
for each row
execute function public.set_health_data_consents_updated_at();

alter table public.health_data_consents enable row level security;

drop policy if exists "health_data_consents_select_own" on public.health_data_consents;
create policy "health_data_consents_select_own"
on public.health_data_consents
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "health_data_consents_insert_own" on public.health_data_consents;
create policy "health_data_consents_insert_own"
on public.health_data_consents
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "health_data_consents_update_own" on public.health_data_consents;
create policy "health_data_consents_update_own"
on public.health_data_consents
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

revoke all on table public.health_data_consents from anon;
grant select, insert, update on table public.health_data_consents to authenticated;
