-- Measurements: append-only time-stamped body readings per authenticated user.

create table if not exists public.measurements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  measured_at date not null,
  weight_kg numeric(5, 2) not null,
  waist_cm numeric(5, 2) not null,
  neck_cm numeric(5, 2) not null,
  created_at timestamptz not null default now(),
  constraint measurements_weight_kg_positive
    check (weight_kg > 0),
  constraint measurements_waist_cm_positive
    check (waist_cm > 0),
  constraint measurements_neck_cm_positive
    check (neck_cm > 0)
);

create index if not exists measurements_user_id_measured_at_idx
  on public.measurements (user_id, measured_at desc);

alter table public.measurements enable row level security;

drop policy if exists "measurements_select_own" on public.measurements;
create policy "measurements_select_own"
on public.measurements
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "measurements_insert_own" on public.measurements;
create policy "measurements_insert_own"
on public.measurements
for insert
to authenticated
with check (auth.uid() = user_id);
