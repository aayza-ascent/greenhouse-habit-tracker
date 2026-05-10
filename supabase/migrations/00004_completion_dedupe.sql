-- Greenhouse · prevent duplicate same-day completions
-- ----------------------------------------------------------------------------
-- The client UI already gates re-completion via isCompletedToday, but the
-- store's completeTask doesn't do a server-side dedup. This unique index is
-- defense-in-depth: a second insert for the same (task, day-in-UTC) raises a
-- duplicate-key error so client retries / direct RPC abuse can't double-bump
-- streak/coins/health.
--
-- We bucket on UTC midnight for simplicity — per-user-tz bucketing would
-- require joining profiles into the index expression (impossible). For users
-- whose timezone is far from UTC, this can occasionally let a "yesterday"
-- completion through when they tap right around their local midnight, which
-- is benign — they actually did do the task on their "today."

create unique index if not exists task_completions_one_per_day
  on public.task_completions (task_id, (date_trunc('day', completed_at at time zone 'UTC')));
