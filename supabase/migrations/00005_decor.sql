-- Greenhouse · decor inventory
-- ----------------------------------------------------------------------------
-- Decor items (pots, paths, trellises, fairy lights) are bought with XP and
-- unlock once per user. Mirrors the shape of inventory_owned. Decor doesn't
-- get placed in the greenhouse grid (yet) — for v1 it's a collection that
-- shows OWNED in the shop and could later drive cosmetic flourishes.

create table if not exists public.decor_owned (
  user_id uuid not null references public.profiles (id) on delete cascade,
  decor_id text not null,
  acquired_at timestamptz not null default now(),
  primary key (user_id, decor_id)
);

alter table public.decor_owned enable row level security;

drop policy if exists decor_owned_owner on public.decor_owned;
create policy decor_owned_owner on public.decor_owned
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
