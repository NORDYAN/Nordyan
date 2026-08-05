-- Add measurement as an approved snapshot reason for Measurement Module v1.0.

alter table public.health_snapshots
  drop constraint if exists health_snapshots_snapshot_reason_check;

alter table public.health_snapshots
  add constraint health_snapshots_snapshot_reason_check
  check (
    snapshot_reason in (
      'onboarding',
      'profile_update',
      'weekly_checkin',
      'measurement'
    )
  );
