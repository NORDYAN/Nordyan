-- Hip circumference for US Navy female body-fat and future WHR.
-- Nullable: existing rows stay valid. Do not backfill or impute.

alter table public.measurements
  add column if not exists hip_cm numeric(5, 2) null;

alter table public.measurements
  drop constraint if exists measurements_hip_cm_positive;

alter table public.measurements
  add constraint measurements_hip_cm_positive
    check (hip_cm is null or hip_cm > 0);

alter table public.health_snapshots
  add column if not exists hip_cm numeric(5, 2) null;

alter table public.health_snapshots
  drop constraint if exists health_snapshots_hip_cm_positive;

alter table public.health_snapshots
  add constraint health_snapshots_hip_cm_positive
    check (hip_cm is null or hip_cm > 0);
