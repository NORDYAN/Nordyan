-- Add presentation-critical engine outputs to health snapshots.
-- Nullable for compatibility with existing historical rows; no backfill.

alter table public.health_snapshots
  add column if not exists body_fat_pct numeric(5, 2) null,
  add column if not exists coach_duration_minutes integer null,
  add column if not exists coach_frequency_per_week integer null;

alter table public.health_snapshots
  drop constraint if exists health_snapshots_body_fat_pct_range;

alter table public.health_snapshots
  add constraint health_snapshots_body_fat_pct_range
    check (body_fat_pct is null or body_fat_pct between 0 and 100);

alter table public.health_snapshots
  drop constraint if exists health_snapshots_coach_duration_minutes_positive;

alter table public.health_snapshots
  add constraint health_snapshots_coach_duration_minutes_positive
    check (coach_duration_minutes is null or coach_duration_minutes > 0);

alter table public.health_snapshots
  drop constraint if exists health_snapshots_coach_frequency_per_week_positive;

alter table public.health_snapshots
  add constraint health_snapshots_coach_frequency_per_week_positive
    check (coach_frequency_per_week is null or coach_frequency_per_week > 0);
