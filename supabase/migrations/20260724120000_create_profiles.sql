-- Profiles: one row per authenticated user.
-- Stores onboarding measurements and basic preferences.
-- Age is never persisted; derive it in the application from date_of_birth.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  first_name text,
  date_of_birth date,
  gender text,
  height_cm numeric(5, 2),
  weight_kg numeric(5, 2),
  waist_cm numeric(5, 2),
  neck_cm numeric(5, 2),
  activity_level text,
  goal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_gender_check
    check (gender is null or gender in ('male', 'female', 'other')),
  constraint profiles_activity_level_check
    check (
      activity_level is null
      or activity_level in (
        'sedentary',
        'lightly_active',
        'moderately_active',
        'very_active',
        'extra_active'
      )
    ),
  constraint profiles_goal_check
    check (
      goal is null
      or goal in ('lose_weight', 'maintain', 'gain_muscle', 'improve_health')
    ),
  constraint profiles_height_cm_positive check (height_cm is null or height_cm > 0),
  constraint profiles_weight_kg_positive check (weight_kg is null or weight_kg > 0),
  constraint profiles_waist_cm_positive check (waist_cm is null or waist_cm > 0),
  constraint profiles_neck_cm_positive check (neck_cm is null or neck_cm > 0)
);

create or replace function public.set_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_profiles_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
