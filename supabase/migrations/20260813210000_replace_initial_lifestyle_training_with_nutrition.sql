-- Initial Lifestyle v1.1: retire training_frequency and add less_healthy_food_frequency.
-- Do not reuse training_frequency. Those values are unrelated to nutrition.
-- Do not fabricate less_healthy_food_frequency from historical training answers.
-- Do not delete historical rows. Legacy rows may keep NULL on the new column.
-- New app submissions still require the field at domain/service level.

alter table public.initial_lifestyle_checks
  add column if not exists less_healthy_food_frequency text;

alter table public.initial_lifestyle_checks
  drop constraint if exists initial_lifestyle_checks_training_frequency_check;

alter table public.initial_lifestyle_checks
  drop column if exists training_frequency;

alter table public.initial_lifestyle_checks
  drop constraint if exists initial_lifestyle_checks_less_healthy_food_frequency_check;

alter table public.initial_lifestyle_checks
  add constraint initial_lifestyle_checks_less_healthy_food_frequency_check
  check (
    less_healthy_food_frequency is null
    or less_healthy_food_frequency in (
      'never',
      'once',
      'two_three',
      'four_six',
      'daily'
    )
  );
