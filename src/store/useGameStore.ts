// Zustand store for all gameplay state. Mirrors the prototype's reducer
// shape but actions are async — they hit Supabase first via the data layer
// and then update the store on success. Realtime subscriptions in syncMiddleware
// ensure cross-device updates land here automatically.
//
// The store does NOT own auth state — that lives in the root layout's
// Session hook. Pass userId into actions explicitly.

import { create } from "zustand";

import type { FlowerType } from "@/components/plants/flowers-v2";
import {
  payoutForCompletion,
  REVIVE_COST_COINS,
  REVIVE_RESTORE_HEALTH,
} from "@/domain/economy";
import { applyCompletion, COMPLETION_HEALTH_BUMP, stageFromHealth } from "@/domain/health";
import { isCompletedToday } from "@/domain/schedule";

import * as plantsApi from "@/data/plants";
import * as profileApi from "@/data/profile";
import * as tasksApi from "@/data/tasks";
import * as inventoryApi from "@/data/inventory";
import { recordTransaction } from "@/data/transactions";
import type { Plant, Profile, Task } from "@/data/types";

// Per-task in-flight set. Keeps a rapid double-tap on the check button from
// firing two completeTask paths concurrently — the second tap bails before
// touching Supabase, so the unique index on task_completions never fires.
// Module-scoped (not in the store) because we don't want this in React state.
const inFlightCompletions = new Set<string>();
const inFlightUncompletions = new Set<string>();

// Adds `row` if its id is new; replaces if present; squashes any duplicates
// that may already exist with the same id (self-healing against past races).
function mergeById<T extends { id: string }>(list: T[], row: T): T[] {
  return [...list.filter((x) => x.id !== row.id), row];
}

function dedupeById<T extends { id: string }>(rows: T[]): T[] {
  return Array.from(new Map(rows.map((r) => [r.id, r])).values());
}

type Celebrate = {
  taskId: string;
  coins: number;
  xp: number;
  plantId: string | null;
  oldStage: number | null;
  newStage: number | null;
};

type State = {
  loading: boolean;
  error: string | null;

  profile: Profile | null;
  tasks: Task[];
  plants: Plant[];
  inventory: FlowerType[];

  celebrate: Celebrate | null;

  // ── lifecycle ──
  setProfile: (p: Profile | null) => void;
  setTasks: (ts: Task[]) => void;
  setPlants: (ps: Plant[]) => void;
  setInventory: (i: FlowerType[]) => void;
  upsertTask: (t: Task) => void;
  upsertPlant: (p: Plant) => void;
  removeTask: (id: string) => void;
  removePlant: (id: string) => void;

  // ── actions ──
  completeTask: (taskId: string) => Promise<void>;
  uncompleteTask: (taskId: string) => Promise<void>;
  clearCelebrate: () => void;

  addTask: (
    input: tasksApi.CreateTaskInput & { plantType?: FlowerType | null },
  ) => Promise<Task>;
  deleteTask: (taskId: string) => Promise<void>;
  movePlant: (plantId: string, col: number, row: number) => Promise<void>;
  /** Unlock a seed type in inventory. Doesn't plant anything in the greenhouse —
   *  the plant row is created only when the user links the type to a task. */
  buyPlant: (plantType: FlowerType, price: number) => Promise<boolean>;
  revivePlant: (plantId: string) => Promise<void>;
  updateProfilePatch: (patch: Parameters<typeof profileApi.updateProfile>[1]) => Promise<void>;
};

export const useGameStore = create<State>((set, get) => ({
  loading: false,
  error: null,
  profile: null,
  tasks: [],
  plants: [],
  inventory: [],
  celebrate: null,

  setProfile: (p) => set({ profile: p }),
  setTasks: (ts) => set({ tasks: dedupeById(ts) }),
  setPlants: (ps) => set({ plants: dedupeById(ps) }),
  setInventory: (i) => set({ inventory: Array.from(new Set(i)) }),
  // Self-healing upserts: filter out any existing rows with this id (which
  // squashes any pre-existing duplicates) and append the new one.
  upsertTask: (t) =>
    set((s) => ({ tasks: [...s.tasks.filter((x) => x.id !== t.id), t] })),
  upsertPlant: (p) =>
    set((s) => ({ plants: [...s.plants.filter((x) => x.id !== p.id), p] })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  removePlant: (id) => set((s) => ({ plants: s.plants.filter((p) => p.id !== id) })),

  completeTask: async (taskId) => {
    // Rapid double-tap guard: the second tap returns before any Supabase
    // call, so the server-side unique index never fires. The `set()` calls
    // below all run after the awaits, so without this lock both calls would
    // pass `isCompletedToday` (state hasn't updated yet) and one would
    // collide on the unique index.
    if (inFlightCompletions.has(taskId)) return;
    const { profile, tasks, plants } = get();
    if (!profile) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (isCompletedToday(task, profile.tz)) return;
    inFlightCompletions.add(taskId);
    try {
    const newStreak = task.streak + 1;
    const { coins, xp } = payoutForCompletion(task.freq, newStreak);
    const now = new Date().toISOString();

    // 1. ledger entry — catch 23505 (unique-constraint on
    // task_completions_one_per_day) and bail. The DB is the source of truth:
    // if it says the task is already done today, we trust it and skip the
    // rest of the side effects rather than crashing the UI.
    try {
      await tasksApi.recordCompletion(profile.id, taskId, coins, xp);
    } catch (e: any) {
      if (e?.code === "23505") return;
      throw e;
    }

    // 2. task streak + last completion
    const updatedTask = await tasksApi.updateTask(taskId, {
      streak: newStreak,
      lastCompletedAt: now,
    });

    // 3. linked plant: bump health, recompute stage
    let updatedPlant: Plant | null = null;
    let oldStage: number | null = null;
    let newStage: number | null = null;
    if (task.plantId) {
      const plant = plants.find((p) => p.id === task.plantId);
      if (plant) {
        const newHealth = applyCompletion(plant.health);
        const ticksAtFull =
          newHealth === 100 ? plant.ticksAtFull + 1 : 0;
        const stageIdx = stageFromHealth(newHealth, newStreak, ticksAtFull);
        oldStage = plant.stageIdx;
        newStage = stageIdx;
        updatedPlant = await plantsApi.updatePlant(plant.id, {
          health: newHealth,
          stageIdx,
          ticksAtFull,
        });
      }
    }

    // 4. profile coins/xp
    const updatedProfile = await profileApi.updateProfile(profile.id, {
      coins: profile.coins + coins,
      xp: profile.xp + xp,
    });

    // 5. transaction ledger
    await recordTransaction(profile.id, {
      kind: "earn_task",
      deltaCoins: coins,
      deltaXp: xp,
      refId: taskId,
    });

    // 6. local state — both updates are by-id replacements, idempotent
    // against concurrent realtime echoes.
    set((s) => ({
      profile: updatedProfile,
      tasks: s.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      plants: updatedPlant
        ? s.plants.map((p) => (p.id === updatedPlant!.id ? updatedPlant! : p))
        : s.plants,
      celebrate: {
        taskId,
        coins,
        xp,
        plantId: updatedPlant?.id ?? null,
        oldStage,
        newStage,
      },
    }));
    } finally {
      inFlightCompletions.delete(taskId);
    }
  },

  uncompleteTask: async (taskId) => {
    // Lossless undo: reverse exactly what completeTask did.
    //   1. Find latest task_completion → get its coins/xp
    //   2. Delete that row + the matching earn_task transaction
    //   3. Reverse profile coins/xp, plant health/stage/ticks, task streak
    //   4. Restore task.last_completed_at to the prior completion (or null)
    if (inFlightUncompletions.has(taskId)) return;
    const { profile, tasks, plants } = get();
    if (!profile) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    inFlightUncompletions.add(taskId);
    try {

    const latest = await tasksApi.fetchLatestCompletion(taskId);
    if (!latest) {
      // Nothing to undo on the ledger — just clear the streak/lastCompletedAt
      // so the UI is consistent.
      const updated = await tasksApi.updateTask(taskId, {
        streak: Math.max(0, task.streak - 1),
        lastCompletedAt: null,
      });
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)) }));
      return;
    }

    await tasksApi.deleteCompletionById(latest.id);
    const priorCompletedAt = await tasksApi.fetchPriorCompletionTime(taskId, latest.id);

    const updatedTask = await tasksApi.updateTask(taskId, {
      streak: Math.max(0, task.streak - 1),
      lastCompletedAt: priorCompletedAt,
    });

    let updatedPlant: Plant | null = null;
    if (task.plantId) {
      const plant = plants.find((p) => p.id === task.plantId);
      if (plant) {
        const newHealth = Math.max(0, plant.health - COMPLETION_HEALTH_BUMP);
        const newStreak = updatedTask.streak;
        const newTicks = newHealth >= 100 ? plant.ticksAtFull : 0;
        updatedPlant = await plantsApi.updatePlant(plant.id, {
          health: newHealth,
          stageIdx: stageFromHealth(newHealth, newStreak, newTicks),
          ticksAtFull: newTicks,
        });
      }
    }

    const updatedProfile = await profileApi.updateProfile(profile.id, {
      coins: Math.max(0, profile.coins - latest.coins_earned),
      xp: Math.max(0, profile.xp - latest.xp_earned),
    });

    set((s) => ({
      profile: updatedProfile,
      tasks: s.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
      plants: updatedPlant
        ? s.plants.map((p) => (p.id === updatedPlant!.id ? updatedPlant! : p))
        : s.plants,
      // Drop the celebrate banner if it was about this task — the user just
      // changed their mind.
      celebrate: s.celebrate?.taskId === taskId ? null : s.celebrate,
    }));
    } finally {
      inFlightUncompletions.delete(taskId);
    }
  },

  clearCelebrate: () => set({ celebrate: null }),

  addTask: async ({ plantType, ...input }) => {
    const { profile, plants } = get();
    if (!profile) throw new Error("No profile loaded.");
    let plantId: string | null = null;
    let createdPlant: Plant | null = null;
    if (plantType) {
      const slot = firstEmptySlot(plants, profile.gridCols, profile.gridRows);
      if (slot) {
        createdPlant = await plantsApi.createPlant(profile.id, {
          type: plantType,
          slotCol: slot.col,
          slotRow: slot.row,
          health: 50,
          stageIdx: 0,
        });
        plantId = createdPlant.id;
      }
    }
    const task = await tasksApi.createTask(profile.id, { ...input, plantId });
    if (createdPlant && task.id) {
      // Back-fill the plant.task_id link so completion can find it.
      const linked = await plantsApi.updatePlant(createdPlant.id, { taskId: task.id });
      // mergeById dedupes against the realtime INSERT echo that may have
      // landed first — without it we'd append a duplicate row.
      set((s) => ({
        tasks: mergeById(s.tasks, task),
        plants: mergeById(s.plants, linked),
      }));
    } else {
      set((s) => ({ tasks: mergeById(s.tasks, task) }));
    }
    return task;
  },

  deleteTask: async (taskId) => {
    // Soft-delete the task (preserves task_completions ledger so the stats
    // heatmap still attributes past completions correctly), then hard-delete
    // the linked plant — without its feeding task it serves no purpose and
    // would just clutter the greenhouse grid.
    const { tasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    const plantId = task?.plantId ?? null;

    await tasksApi.deleteTask(taskId);
    if (plantId) {
      try {
        await plantsApi.deletePlant(plantId);
      } catch (e) {
        // Don't roll back the task delete — even if the plant delete fails,
        // the user's intent (drop the task) is still honored. They can revive
        // / move the orphan later.
        console.warn("[deleteTask] plant delete failed", e);
      }
    }
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== taskId),
      plants: plantId ? s.plants.filter((p) => p.id !== plantId) : s.plants,
    }));
  },

  movePlant: async (plantId, col, row) => {
    const { plants } = get();
    const a = plants.find((p) => p.id === plantId);
    if (!a) return;
    const b = plants.find((p) => p.id !== plantId && p.slotCol === col && p.slotRow === row);
    if (b) {
      await plantsApi.swapPlantSlots(a, b);
      set((s) => ({
        plants: s.plants.map((p) => {
          if (p.id === a.id) return { ...p, slotCol: col, slotRow: row };
          if (p.id === b.id) return { ...p, slotCol: a.slotCol, slotRow: a.slotRow };
          return p;
        }),
      }));
    } else {
      const updated = await plantsApi.updatePlant(plantId, { slotCol: col, slotRow: row });
      set((s) => ({
        plants: s.plants.map((p) => (p.id === plantId ? updated : p)),
      }));
    }
  },

  buyPlant: async (plantType, price) => {
    const { profile, inventory } = get();
    if (!profile) throw new Error("No profile loaded.");
    if (inventory.includes(plantType)) return false; // already unlocked
    if (profile.coins < price) return false;

    await inventoryApi.unlockPlant(profile.id, plantType);
    const updatedProfile = await profileApi.updateProfile(profile.id, {
      coins: profile.coins - price,
    });
    await recordTransaction(profile.id, {
      kind: "spend_buy",
      deltaCoins: -price,
    });
    set((s) => ({
      profile: updatedProfile,
      inventory: s.inventory.includes(plantType) ? s.inventory : [...s.inventory, plantType],
    }));
    return true;
  },

  revivePlant: async (plantId) => {
    const { profile, plants } = get();
    if (!profile) throw new Error("No profile loaded.");
    if (profile.coins < REVIVE_COST_COINS) return;
    const plant = plants.find((p) => p.id === plantId);
    if (!plant) return;
    const updated = await plantsApi.updatePlant(plantId, {
      health: REVIVE_RESTORE_HEALTH,
      stageIdx: stageFromHealth(REVIVE_RESTORE_HEALTH, 0, 0),
      ticksAtFull: 0,
    });
    const updatedProfile = await profileApi.updateProfile(profile.id, {
      coins: profile.coins - REVIVE_COST_COINS,
    });
    await recordTransaction(profile.id, {
      kind: "spend_revive",
      deltaCoins: -REVIVE_COST_COINS,
      refId: plantId,
    });
    set((s) => ({
      profile: updatedProfile,
      plants: s.plants.map((p) => (p.id === plantId ? updated : p)),
    }));
  },

  updateProfilePatch: async (patch) => {
    const { profile } = get();
    if (!profile) return;
    const updated = await profileApi.updateProfile(profile.id, patch);
    set({ profile: updated });
  },
}));

function firstEmptySlot(
  plants: readonly Plant[],
  gridCols: number,
  gridRows: number,
): { col: number; row: number } | null {
  const occupied = new Set(plants.map((p) => `${p.slotCol},${p.slotRow}`));
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      if (!occupied.has(`${c},${r}`)) return { col: c, row: r };
    }
  }
  return null;
}
