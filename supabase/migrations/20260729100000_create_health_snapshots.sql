-- Health snapshots: append-only engine output history per authenticated user.
-- One row captures a point-in-time health score, focus, coach recommendation,
-- and the measurements used when the snapshot was taken.

create table if not exists public.health_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  overall_score integer not null,
  bmi_score integer not null,
  whtr_score integer not null,
  body_fat_score integer not null,
  activity_score integer not null,
  primary_focus text not null,
  coach_recommendation_id text not null,
  weight_kg numeric(5, 2) not null,
  waist_cm numeric(5, 2) not null,
  neck_cm numeric(5, 2) not null,
  engine_version text not null,
  snapshot_reason text not null,
  constraint health_snapshots_overall_score_range
    check (overall_score between 0 and 100),
  constraint health_snapshots_bmi_score_range
    check (bmi_score between 0 and 100),
  constraint health_snapshots_whtr_score_range
    check (whtr_score between 0 and 100),
  constraint health_snapshots_body_fat_score_range
    check (body_fat_score between 0 and 100),
  constraint health_snapshots_activity_score_range
    check (activity_score between 0 and 100),
  constraint health_snapshots_weight_kg_positive
    check (weight_kg > 0),
  constraint health_snapshots_waist_cm_positive
    check (waist_cm > 0),
  constraint health_snapshots_neck_cm_positive
    check (neck_cm > 0),
  constraint health_snapshots_snapshot_reason_check
    check (
      snapshot_reason in (
        'onboarding',
        'profile_update',
        'weekly_checkin'
      )
    )
);

create index if not exists health_snapshots_user_id_created_at_idx
  on public.health_snapshots (user_id, created_at desc);

alter table public.health_snapshots enable row level security;

drop policy if exists "health_snapshots_select_own" on public.health_snapshots;
create policy "health_snapshots_select_own"
on public.health_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "health_snapshots_insert_own" on public.health_snapshots;
create policy "health_snapshots_insert_own"
on public.health_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);
