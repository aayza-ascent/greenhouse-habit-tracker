-- Greenhouse · nightly health tick
-- ----------------------------------------------------------------------------
-- Runs hourly via pg_cron, but each invocation only processes users for whom
-- it's currently between 00:00 and 00:59 local time (per profiles.tz). Each
-- per-user tick decays health on missed tasks, awards full-health bonuses,
-- and recomputes plant.stage_idx.
--
-- Mirrors the TS stageFromHealth in src/domain/health.ts. If you change the
-- bands here, change them there too.

-- ───── stage_from_health (SQL mirror of TS) ─────────────────────────────────
create or replace function public.stage_from_health(
  health int,
  streak int,
  ticks_at_full int
) returns smallint
language sql
immutable
as $$
  select case
    when health <= 19 then 11
    when health <= 29 then 10
    when health <= 39 then 9
    when health <= 49 then 8
    when health >= 96 and streak >= 7 and ticks_at_full >= 2 then 7
    when health >= 80 and streak >= 7 then 6
    when health >= 70 and streak >= 3 then 5
    when health >= 60 and streak >= 3 then 4
    when health >= 50 and streak >= 3 then 3
    when streak >= 2 then 2
    when streak >= 1 then 1
    else 0
  end::smallint;
$$;

-- ───── decay amount per frequency ──────────────────────────────────────────
create or replace function public.decay_per_miss(freq text)
returns int
language sql
immutable
as $$
  select case freq
    when 'daily'   then 15
    when 'dow'     then 12
    when 'weekly'  then 8
    when 'monthly' then 5
    else 0
  end;
$$;

-- ───── tick_user_plants(user_id, now) ──────────────────────────────────────
-- Called once when it's local midnight for the user. For each plant:
--   1. If the linked task was due since plants.last_tick_at and not completed
--      since then → decay health, reset task.streak.
--   2. If health is now 100 → bump ticks_at_full; if ≥ 2, mint bonus coins/xp.
--   3. Otherwise reset ticks_at_full to 0.
--   4. Recompute stage_idx via stage_from_health.
-- Updates plants.last_tick_at to `now` regardless.
create or replace function public.tick_user_plants(p_user uuid, p_now timestamptz)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  new_health int;
  bonus_coins int := 0;
  bonus_xp int := 0;
  new_ticks int;
  task_due boolean;
  task_completed_recently boolean;
begin
  for r in
    select pl.id as plant_id, pl.health, pl.ticks_at_full, pl.last_tick_at,
           pl.task_id, pl.stage_idx,
           t.id as t_id, t.freq as t_freq, t.dows as t_dows,
           t.streak as t_streak, t.last_completed_at
    from plants pl
    left join tasks t on t.id = pl.task_id and t.active
    where pl.user_id = p_user
  loop
    new_health := r.health;
    new_ticks := r.ticks_at_full;

    if r.t_id is not null then
      task_completed_recently := r.last_completed_at is not null
        and r.last_completed_at > r.last_tick_at;
      task_due := case r.t_freq
        when 'daily'   then true
        when 'dow'     then extract(isodow from p_now)::int = any (r.t_dows)
        when 'weekly'  then r.last_completed_at is null
                          or r.last_completed_at < p_now - interval '7 days'
        when 'monthly' then r.last_completed_at is null
                          or r.last_completed_at < p_now - interval '30 days'
      end;

      if task_due and not task_completed_recently then
        new_health := greatest(0, r.health - public.decay_per_miss(r.t_freq));
        new_ticks := 0;
        update tasks set streak = 0 where id = r.t_id;
      elsif new_health = 100 then
        new_ticks := r.ticks_at_full + 1;
        if new_ticks >= 2 then
          bonus_coins := bonus_coins + 15;
          bonus_xp := bonus_xp + 25;
          insert into transactions (user_id, kind, delta_coins, delta_xp, ref_id)
          values (p_user, 'full_health_bonus', 15, 25, r.plant_id);
        end if;
      else
        new_ticks := 0;
      end if;
    end if;

    update plants
      set health = new_health,
          stage_idx = public.stage_from_health(new_health,
            coalesce(r.t_streak, 0), new_ticks),
          ticks_at_full = new_ticks,
          last_tick_at = p_now
      where id = r.plant_id;
  end loop;

  -- Profile rollup: pay out any bonuses, refresh streak (longest active task).
  if bonus_coins > 0 or bonus_xp > 0 then
    update profiles
      set coins = coins + bonus_coins,
          xp    = xp + bonus_xp
      where id = p_user;
  end if;

  update profiles
    set streak = coalesce(
          (select max(streak) from tasks where user_id = p_user and active),
          0
        ),
        last_tick_at = p_now
    where id = p_user;
end;
$$;

-- ───── tick_all_users(now) — pg_cron entry point ───────────────────────────
-- Called hourly. For each profile where the local hour is 0, run the per-user
-- tick. We re-use `last_tick_at` to dedupe — only profiles whose last tick was
-- more than 23 hours ago get processed, so a transient pg_cron flap can't
-- double-decay anyone.
create or replace function public.tick_all_users(p_now timestamptz default now())
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  processed int := 0;
begin
  for r in
    select id, tz from profiles
    where extract(hour from p_now at time zone tz) = 0
      and (last_tick_at < p_now - interval '23 hours')
  loop
    perform public.tick_user_plants(r.id, p_now);
    processed := processed + 1;
  end loop;
  return processed;
end;
$$;

-- Allow authenticated users to invoke tick_user_plants on themselves only
-- (used by the dev "Skip a day" button on Profile).
revoke all on function public.tick_user_plants(uuid, timestamptz) from public;
revoke all on function public.tick_all_users(timestamptz) from public;
grant execute on function public.tick_user_plants(uuid, timestamptz) to authenticated;
-- tick_all_users stays service_role-only.

-- ───── pg_cron schedule (uncomment after enabling pg_cron in Supabase) ─────
-- 1. In Supabase Dashboard → Database → Extensions → enable `pg_cron`.
-- 2. Then run, in the SQL Editor:
--
-- select cron.schedule(
--   'greenhouse-tick',
--   '0 * * * *',
--   $$select public.tick_all_users(now())$$
-- );
--
-- To stop the schedule: select cron.unschedule('greenhouse-tick');
