-- Greenhouse · push notification tokens
-- ----------------------------------------------------------------------------
-- One row per device the user signs into. Tokens are Expo push tokens
-- (`ExponentPushToken[…]`); the wilt-alert Edge Function sends to all of
-- them when a plant enters the wilting band.

create table if not exists public.push_tokens (
  user_id uuid not null references public.profiles (id) on delete cascade,
  token text not null,
  platform text check (platform in ('ios', 'android', 'web')),
  created_at timestamptz not null default now(),
  primary key (user_id, token)
);

alter table public.push_tokens enable row level security;

drop policy if exists push_tokens_owner on public.push_tokens;
create policy push_tokens_owner on public.push_tokens
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
