# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository state

MVP feature-complete in code. All 11 phases of `~/.claude/plans/clever-rolling-glacier.md` are implemented (Phase 10 includes a TestFlight/Vercel deploy step that's a user action, not code). `npx tsc --noEmit` and `npx jest` both pass.

The original design handoff under `greenhouse-prototype-design/` is **reference-only** — read it, don't import from it. App code lives in `app/` (Expo Router) and `src/` (everything else); SQL lives in `supabase/migrations/` and Edge Functions in `supabase/functions/`.

## Architecture at a glance

**Frontend:** Expo SDK 54 + Expo Router 6 (file-based routing) + React 19.1 + RN 0.81. Web ships in SPA mode (`web.output: "single"`).

**State:** Zustand (`src/store/useGameStore.ts`) mirrors the prototype's reducer shape. Actions are async — they hit Supabase via the data layer (`src/data/*`), then update the store on success. `useSyncStore` (`src/store/sync.ts`) handles initial fetch + Realtime subscriptions for cross-device sync.

**Backend:** Supabase — Postgres + Auth + Realtime + Edge Functions + pg_cron. Schema in `supabase/migrations/` (apply via Dashboard SQL Editor or `supabase db push`).

**Plants:** rendered via `react-native-svg`. `src/components/plants/flowers-v2.ts` is the 1:1 port of the prototype's `flowers-v2.jsx` — same BLOOMS, FLOWERS_V2, STAGES, CLUMP, LEAVES, drawPot, buildFlowerGrid logic. `src/components/plants/Plant.tsx` is the consumer. `/dev/plant-reference` route renders the 10 species × 12 stages grid for visual diff against `greenhouse-prototype-design/project/plant-reference.html`.

**Domain math single source of truth:**
- `src/domain/economy.ts` — coin/XP per frequency, streak multipliers, revive cost.
- `src/domain/health.ts` — `stageFromHealth(health, streak, ticksAtFull)` returning a 0-11 stage index. **Mirrored in SQL** in `supabase/migrations/00002_cron_tick.sql` (`public.stage_from_health`). If you change banding here, change it there too. Covered by 20 Jest tests in `src/domain/__tests__/health.test.ts`.
- `src/domain/schedule.ts` — `isCompletedToday` / `isDueToday` in a given timezone.

**Cron (health decay):** `tick_user_plants(uuid, timestamptz)` decays per-plant health on missed tasks, awards full-health bonuses, recomputes stages. `tick_all_users(now)` is the pg_cron entry point; it filters profiles to those at local-midnight via `extract(hour from now() at time zone tz) = 0`. The dev "Skip a day" button on Profile calls the per-user RPC directly via `src/data/cron.ts`.

## Commands

- `npm start` — Expo dev server
- `npm run ios` / `npm run android` / `npm run web`
- `npm run lint` — `expo lint`
- `npm test` — Jest (jest-expo preset)
- `npx tsc --noEmit` — type-check
- `npx expo-doctor` — validate Expo deps + config
- `npx expo install <pkg>` — preferred over `npm install` for Expo / RN deps (resolves SDK-correct versions)
- `npx jest path/to/test.test.ts` — run a single test file

## TS path aliases

- `@/*` → `src/*` (e.g. `@/theme/palettes`)
- `~/*` → repo root

## Environment setup

`.env` (gitignored) needs:
- `EXPO_PUBLIC_SUPABASE_URL` — `https://<ref>.supabase.co`
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — `sb_publishable_...` (legacy `EXPO_PUBLIC_SUPABASE_ANON_KEY` JWT also works)

Apply migrations in order via Supabase Dashboard SQL Editor:
1. `supabase/migrations/00001_initial_schema.sql` — 6 tables (profiles, tasks, plants, task_completions, inventory_owned, transactions), RLS, auth.users insert trigger, Realtime publication.
2. `supabase/migrations/00002_cron_tick.sql` — `stage_from_health`, `tick_user_plants`, `tick_all_users`. pg_cron schedule is in a comment at the bottom — uncomment after enabling the `pg_cron` extension.
3. `supabase/migrations/00003_push_tokens.sql` — push token table for the wilt-alert function.

To enable wilt-alert pushes: `supabase functions deploy wilt-alert --no-verify-jwt`, then schedule it via pg_cron (snippet in `supabase/functions/wilt-alert/index.ts`).

## Auth flow

- Email/password is the primary signup path. Apple Sign-In on iOS via `expo-apple-authentication` (requires *Sign in with Apple* capability on the dev profile). Google OAuth deferred to a follow-up.
- Root `app/_layout.tsx` listens to session and routes:
  - no session → `/(auth)/sign-in`
  - session + `profile.onboarded === false` → `/onboarding`
  - session + onboarded → `/(tabs)/greenhouse`
  - `/dev/*` bypasses the auth gate (so `/dev/plant-reference` is reachable without sign-in).

## Web build caveat

`web.output: "single"` (SPA) — not `"static"`. The app is auth-gated, so SSR has no SEO benefit and will crash because supabase-js touches `window.localStorage` at module load. If you ever flip back to `"static"`, every imported module touching `window`, `localStorage`, or `document` must be SSR-guarded. `src/data/supabase.ts` already wraps web storage with a `typeof window` guard as belt-and-braces.

## Working with the design bundle

Files live in `greenhouse-prototype-design/project/`. Reference-only — the React components have been ported into `src/components/` and `app/`.

- `flowers-v2.jsx` → `src/components/plants/flowers-v2.ts` + `Plant.tsx`
- `pixel-art.jsx` palettes → `src/theme/palettes.ts`; HUD icons → `src/components/ui/icons.tsx`
- `store.jsx` reducer math → `src/domain/economy.ts` + `src/store/useGameStore.ts` actions
- `screens.jsx` layouts → `app/(tabs)/*.tsx`, `app/new-task.tsx`, `app/onboarding.tsx`, `src/components/CelebrationOverlay.tsx`

The bundle's own README mentions a stale path (`greenhouse-task-management/`); the actual dir is `greenhouse-prototype-design/`.

## Conventions

- **Plant emoji are task icons only.** Plants themselves are always rendered as `<Plant>` pixel sprites — never emoji.
- **Domain math lives in `src/domain/`**, not in components. Components import constants and pure functions; they never compute payouts or stage transitions inline.
- **DB ↔ store column mapping:** snake_case in Postgres, camelCase in TS. The mapping is concentrated in `src/data/{profile,tasks,plants}.ts` and `src/store/sync.ts`. Don't leak `slot_col` / `last_completed_at` into UI code.
- **Realtime is the source of truth for cross-device updates**, but actions still call the data-layer write *before* updating the store optimistically — the Realtime echo is a no-op confirmation. Don't rely on Realtime alone or actions feel laggy.
