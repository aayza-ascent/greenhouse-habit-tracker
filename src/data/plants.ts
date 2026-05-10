import { supabase } from "./supabase";
import type { FlowerType } from "@/components/plants/flowers-v2";
import type { Plant } from "./types";

type DbPlant = {
  id: string;
  user_id: string;
  type: FlowerType;
  slot_col: number;
  slot_row: number;
  health: number;
  stage_idx: number;
  task_id: string | null;
  ticks_at_full: number;
  last_tick_at: string;
  created_at: string;
};

const fromDb = (p: DbPlant): Plant => ({
  id: p.id,
  userId: p.user_id,
  type: p.type,
  slotCol: p.slot_col,
  slotRow: p.slot_row,
  health: p.health,
  stageIdx: p.stage_idx,
  taskId: p.task_id,
  ticksAtFull: p.ticks_at_full,
  lastTickAt: p.last_tick_at,
  createdAt: p.created_at,
});

export async function listPlants(userId: string): Promise<Plant[]> {
  const { data, error } = await supabase
    .from("plants")
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return (data as DbPlant[]).map(fromDb);
}

export type CreatePlantInput = {
  type: FlowerType;
  slotCol: number;
  slotRow: number;
  taskId?: string | null;
  health?: number;
  stageIdx?: number;
};

export async function createPlant(userId: string, input: CreatePlantInput): Promise<Plant> {
  const { data, error } = await supabase
    .from("plants")
    .insert({
      user_id: userId,
      type: input.type,
      slot_col: input.slotCol,
      slot_row: input.slotRow,
      task_id: input.taskId ?? null,
      health: input.health ?? 50,
      stage_idx: input.stageIdx ?? 0,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromDb(data as DbPlant);
}

export async function updatePlant(
  plantId: string,
  patch: Partial<{
    health: number;
    stageIdx: number;
    slotCol: number;
    slotRow: number;
    taskId: string | null;
    ticksAtFull: number;
    lastTickAt: string;
  }>,
): Promise<Plant> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.health !== undefined) dbPatch.health = patch.health;
  if (patch.stageIdx !== undefined) dbPatch.stage_idx = patch.stageIdx;
  if (patch.slotCol !== undefined) dbPatch.slot_col = patch.slotCol;
  if (patch.slotRow !== undefined) dbPatch.slot_row = patch.slotRow;
  if (patch.taskId !== undefined) dbPatch.task_id = patch.taskId;
  if (patch.ticksAtFull !== undefined) dbPatch.ticks_at_full = patch.ticksAtFull;
  if (patch.lastTickAt !== undefined) dbPatch.last_tick_at = patch.lastTickAt;
  const { data, error } = await supabase
    .from("plants")
    .update(dbPatch)
    .eq("id", plantId)
    .select("*")
    .single();
  if (error) throw error;
  return fromDb(data as DbPlant);
}

// Atomic swap when dragging onto an occupied slot. We update both rows in
// quick succession; a server-side function would be safer but RLS-scoped
// per-row updates are good enough for v1's single-user-per-greenhouse model.
export async function swapPlantSlots(
  plantA: Plant,
  plantB: Plant,
): Promise<void> {
  const { error: errA } = await supabase
    .from("plants")
    .update({ slot_col: plantB.slotCol, slot_row: plantB.slotRow })
    .eq("id", plantA.id);
  if (errA) throw errA;
  const { error: errB } = await supabase
    .from("plants")
    .update({ slot_col: plantA.slotCol, slot_row: plantA.slotRow })
    .eq("id", plantB.id);
  if (errB) throw errB;
}
