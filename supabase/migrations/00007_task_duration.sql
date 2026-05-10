-- Greenhouse · task duration
-- ----------------------------------------------------------------------------
-- Stores the rough time-budget for a task in minutes (defaults to 15 — a
-- middling habit length). Informational only — doesn't gate anything in the
-- gameplay loop. Exposed in the new-task form and shown in the task row's
-- meta line.

alter table public.tasks
  add column if not exists duration_minutes int not null default 15
  check (duration_minutes between 1 and 480);
