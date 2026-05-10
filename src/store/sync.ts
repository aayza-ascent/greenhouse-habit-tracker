// Sync layer — pulls initial state from Supabase on session, then subscribes
// to Realtime so cross-device updates land in the store automatically.
//
// Usage: call `useSyncStore(session)` once near the root of the app (after
// the session resolves) and the store fills itself.

import * as React from "react";
import type { Session } from "@supabase/supabase-js";

import { listInventory } from "@/data/inventory";
import { listPlants } from "@/data/plants";
import { fetchProfile } from "@/data/profile";
import { listTasks } from "@/data/tasks";
import { supabase } from "@/data/supabase";
import { registerPushToken } from "@/notifications/registerPushToken";
import type { Plant, Profile, Task } from "@/data/types";
import { useGameStore } from "./useGameStore";

const dbToTask = (t: any): Task => ({
  id: t.id,
  userId: t.user_id,
  name: t.name,
  icon: t.icon,
  freq: t.freq,
  dows: t.dows ?? [],
  reminderTime: t.reminder_time ?? null,
  streak: t.streak ?? 0,
  lastCompletedAt: t.last_completed_at ?? null,
  plantId: t.plant_id ?? null,
  active: t.active,
  createdAt: t.created_at,
});

const dbToPlant = (p: any): Plant => ({
  id: p.id,
  userId: p.user_id,
  type: p.type,
  slotCol: p.slot_col,
  slotRow: p.slot_row,
  health: p.health,
  stageIdx: p.stage_idx,
  taskId: p.task_id ?? null,
  ticksAtFull: p.ticks_at_full ?? 0,
  lastTickAt: p.last_tick_at,
  createdAt: p.created_at,
});

const dbToProfile = (p: any): Profile => ({
  id: p.id,
  username: p.username,
  level: p.level,
  xp: p.xp,
  coins: p.coins,
  streak: p.streak,
  paletteKey: p.palette_key,
  timeOfDay: p.time_of_day,
  gridCols: p.grid_cols,
  gridRows: p.grid_rows,
  tz: p.tz,
  lastTickAt: p.last_tick_at,
  onboarded: p.onboarded,
  createdAt: p.created_at,
  updatedAt: p.updated_at,
});

export function useSyncStore(session: Session | null): void {
  React.useEffect(() => {
    if (!session) {
      // Clear store on sign-out so we don't leak state between accounts.
      const s = useGameStore.getState();
      s.setProfile(null);
      s.setTasks([]);
      s.setPlants([]);
      s.setInventory([]);
      return;
    }

    const userId = session.user.id;
    let cancelled = false;

    (async () => {
      try {
        const [profile, tasks, plants, inventory] = await Promise.all([
          fetchProfile(userId),
          listTasks(userId),
          listPlants(userId),
          listInventory(userId),
        ]);
        if (cancelled) return;
        const s = useGameStore.getState();
        s.setProfile(profile);
        s.setTasks(tasks);
        s.setPlants(plants);
        s.setInventory(inventory);
      } catch (e) {
        console.warn("[sync] initial fetch failed", e);
      }
      // Best-effort: register this device's push token. Never throws.
      registerPushToken(userId).catch((e) =>
        console.warn("[sync] push token registration failed", e),
      );
    })();

    // Realtime: any row change for this user reflects into the store.
    const channel = supabase
      .channel(`user:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === "DELETE") return;
          useGameStore.getState().setProfile(dbToProfile(payload.new));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${userId}` },
        (payload) => {
          const s = useGameStore.getState();
          if (payload.eventType === "DELETE") {
            s.removeTask((payload.old as any).id);
          } else {
            const t = dbToTask(payload.new);
            if (!t.active) s.removeTask(t.id);
            else s.upsertTask(t);
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "plants", filter: `user_id=eq.${userId}` },
        (payload) => {
          const s = useGameStore.getState();
          if (payload.eventType === "DELETE") {
            s.removePlant((payload.old as any).id);
          } else {
            s.upsertPlant(dbToPlant(payload.new));
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [session?.user.id]);
}
