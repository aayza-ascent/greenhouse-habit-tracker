-- Greenhouse · initial schema
-- ----------------------------------------------------------------------------
-- 6 tables (profiles, tasks, plants, task_completions, inventory_owned,
-- transactions), RLS scoped to auth.uid(), and a trigger that seeds a
-- profiles row whenever a new auth.users row appears.
--
-- Apply via Supabase Dashboard SQL Editor, or `supabase db push` once the
-- CLI is configured. Idempotent enough for re-runs in a dev project.

-- ───── Extensions ──────────────────────────────────────────────────────────
create extension if not exists "pgcrypto"; -- gen_random_uuid

-- ───── profiles ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text,
  level int not null default 1,
  xp int not null default 0,
  coins int not null default 0,
  streak int not null default 0,
  palette_key text not null default 'terracotta'
    check (palette_key in ('terracotta', 'twilight', 'pastel')),
  time_of_day text not null default 'day'
    check (time_of_day in ('day', 'dusk', 'night')),
  grid_cols int not null default 6 check (grid_cols between 4 and 8),
  grid_rows int not null default 6 check (grid_rows between 3 and 8),
  tz text not null default 'UTC', -- IANA timezone name
  last_tick_at timestamptz not null default now(),
  onboarded boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───── tasks ───────────────────────────────────────────────────────────────
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  name text not null,
  icon text not null default '🌱',
  freq text not null check (freq in ('daily', 'dow', 'weekly', 'monthly')),
  dows smallint[] not null default '{}'::smallint[], -- ISO 1=Mon .. 7=Sun
  reminder_time time,
  streak int not null default 0,
  last_completed_at timestamptz,
  plant_id uuid, -- FK added below after plants exists
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists tasks_user_active_idx on public.tasks (user_id) where active;

-- ───── plants ──────────────────────────────────────────────────────────────
create table if not exists public.plants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  slot_col int not null,
  slot_row int not null,
  health int not null default 50 check (health between 0 and 100),
  stage_idx smallint not null default 0 check (stage_idx between 0 and 11),
  task_id uuid references public.tasks (id) on delete set null,
  ticks_at_full int not null default 0,
  last_tick_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, slot_col, slot_row)
);
create index if not exists plants_user_idx on public.plants (user_id);

-- Wire the deferred FK from tasks → plants now that the table exists.
alter table public.tasks
  add constraint tasks_plant_id_fkey
  foreign key (plant_id) references public.plants (id) on delete set null;

-- ───── task_completions (ledger for stats heatmap + audit) ─────────────────
create table if not exists public.task_completions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  completed_at timestamptz not null default now(),
  coins_earned int not null default 0,
  xp_earned int not null default 0
);
create index if not exists task_completions_user_date_idx
  on public.task_completions (user_id, completed_at desc);

-- ───── inventory_owned (which plant types user has unlocked) ───────────────
create table if not exists public.inventory_owned (
  user_id uuid not null references public.profiles (id) on delete cascade,
  plant_type text not null,
  acquired_at timestamptz not null default now(),
  primary key (user_id, plant_type)
);

-- ───── transactions (coin/xp ledger) ───────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in (
    'earn_task', 'spend_buy', 'spend_revive', 'streak_bonus', 'full_health_bonus'
  )),
  delta_coins int not null default 0,
  delta_xp int not null default 0,
  ref_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists transactions_user_date_idx
  on public.transactions (user_id, created_at desc);

-- ───── Auto-seed profile on signup ─────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, tz)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'tz', 'UTC')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ───── updated_at maintenance ──────────────────────────────────────────────
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- ───── Row-Level Security ──────────────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.tasks             enable row level security;
alter table public.plants            enable row level security;
alter table public.task_completions  enable row level security;
alter table public.inventory_owned   enable row level security;
alter table public.transactions      enable row level security;

-- Profiles: users see and update only their own row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- All user-owned tables share the same shape: select / insert / update / delete
-- gated on `user_id = auth.uid()`. Wrap in a helper-style block.

-- tasks
drop policy if exists tasks_owner on public.tasks;
create policy tasks_owner on public.tasks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- plants
drop policy if exists plants_owner on public.plants;
create policy plants_owner on public.plants
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- task_completions
drop policy if exists task_completions_owner on public.task_completions;
create policy task_completions_owner on public.task_completions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- inventory_owned
drop policy if exists inventory_owned_owner on public.inventory_owned;
create policy inventory_owned_owner on public.inventory_owned
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- transactions (insert-only by client; client-then-sync model. Server-side
-- functions can write via service_role.)
drop policy if exists transactions_owner on public.transactions;
create policy transactions_owner on public.transactions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ───── Realtime ────────────────────────────────────────────────────────────
-- Allow Realtime subscriptions on the tables the client mirrors.
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.plants;
