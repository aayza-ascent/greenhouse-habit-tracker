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
import { applyCompletion, stageFromHealth } from "@/domain/health";

import * as plantsApi from "@/data/plants";
import * as profileApi from "@/data/profile";
import * as tasksApi from "@/data/tasks";
import * as inventoryApi from "@/data/inventory";
import { recordTransaction } from "@/data/transactions";
import type { Plant, Profile, Task } from "@/data/types";

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
  movePlant: (plantId: string, col: number, row: number) => Promise<void>;
  buyPlant: (plantType: FlowerType, price: number) => Promise<Plant | null>;
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
  setTasks: (ts) => set({ tasks: ts }),
  setPlants: (ps) => set({ plants: ps }),
  setInventory: (i) => set({ inventory: i }),
  upsertTask: (t) =>
    set((s) => ({
      tasks: s.tasks.some((x) => x.id === t.id)
        ? s.tasks.map((x) => (x.id === t.id ? t : x))
        : [...s.tasks, t],
    })),
  upsertPlant: (p) =>
    set((s) => ({
      plants: s.plants.some((x) => x.id === p.id)
        ? s.plants.map((x) => (x.id === p.id ? p : x))
        : [...s.plants, p],
    })),
  removeTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),
  removePlant: (id) => set((s) => ({ plants: s.plants.filter((p) => p.id !== id) })),

  completeTask: async (taskId) => {
    const { profile, tasks, plants } = get();
    if (!profile) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    const newStreak = task.streak + 1;
    const { coins, xp } = payoutForCompletion(task.freq, newStreak);
    const now = new Date().toISOString();

    // 1. ledger entry
    await tasksApi.recordCompletion(profile.id, taskId, coins, xp);

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

    // 6. local state
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
  },

  uncompleteTask: async (taskId) => {
    // Best-effort undo: reverse the streak bump only. The ledger entries
    // remain in `task_completions` so stats history is preserved.
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;
    const updated = await tasksApi.updateTask(taskId, {
      streak: Math.max(0, task.streak - 1),
      lastCompletedAt: null,
    });
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)) }));
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
      set((s) => ({
        tasks: [...s.tasks, task],
        plants: [...s.plants, linked],
      }));
    } else {
      set((s) => ({ tasks: [...s.tasks, task] }));
    }
    return task;
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
    const { profile, plants } = get();
    if (!profile) throw new Error("No profile loaded.");
    if (profile.coins < price) return null;
    const slot = firstEmptySlot(plants, profile.gridCols, profile.gridRows);
    if (!slot) return null;
    const created = await plantsApi.createPlant(profile.id, {
      type: plantType,
      slotCol: slot.col,
      slotRow: slot.row,
      health: 50,
      stageIdx: 0,
    });
    await inventoryApi.unlockPlant(profile.id, plantType);
    const updatedProfile = await profileApi.updateProfile(profile.id, {
      coins: profile.coins - price,
    });
    await recordTransaction(profile.id, {
      kind: "spend_buy",
      deltaCoins: -price,
      refId: created.id,
    });
    set((s) => ({
      profile: updatedProfile,
      plants: [...s.plants, created],
      inventory: s.inventory.includes(plantType) ? s.inventory : [...s.inventory, plantType],
    }));
    return created;
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
