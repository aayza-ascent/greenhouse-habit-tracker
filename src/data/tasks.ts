import { supabase } from "./supabase";
import type { Frequency } from "@/domain/economy";
import type { Task } from "./types";

type DbTask = {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  freq: Frequency;
  dows: number[];
  reminder_time: string | null;
  streak: number;
  last_completed_at: string | null;
  plant_id: string | null;
  active: boolean;
  created_at: string;
};

const fromDb = (t: DbTask): Task => ({
  id: t.id,
  userId: t.user_id,
  name: t.name,
  icon: t.icon,
  freq: t.freq,
  dows: t.dows ?? [],
  reminderTime: t.reminder_time,
  streak: t.streak,
  lastCompletedAt: t.last_completed_at,
  plantId: t.plant_id,
  active: t.active,
  createdAt: t.created_at,
});

export async function listTasks(userId: string): Promise<Task[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DbTask[]).map(fromDb);
}

export type CreateTaskInput = {
  name: string;
  icon: string;
  freq: Frequency;
  dows?: number[];
  reminderTime?: string | null;
  plantId?: string | null;
};

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: userId,
      name: input.name,
      icon: input.icon,
      freq: input.freq,
      dows: input.dows ?? [],
      reminder_time: input.reminderTime ?? null,
      plant_id: input.plantId ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return fromDb(data as DbTask);
}

export async function updateTask(
  taskId: string,
  patch: Partial<{
    name: string;
    icon: string;
    freq: Frequency;
    dows: number[];
    reminderTime: string | null;
    streak: number;
    lastCompletedAt: string | null;
    plantId: string | null;
    active: boolean;
  }>,
): Promise<Task> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.name !== undefined) dbPatch.name = patch.name;
  if (patch.icon !== undefined) dbPatch.icon = patch.icon;
  if (patch.freq !== undefined) dbPatch.freq = patch.freq;
  if (patch.dows !== undefined) dbPatch.dows = patch.dows;
  if (patch.reminderTime !== undefined) dbPatch.reminder_time = patch.reminderTime;
  if (patch.streak !== undefined) dbPatch.streak = patch.streak;
  if (patch.lastCompletedAt !== undefined) dbPatch.last_completed_at = patch.lastCompletedAt;
  if (patch.plantId !== undefined) dbPatch.plant_id = patch.plantId;
  if (patch.active !== undefined) dbPatch.active = patch.active;
  const { data, error } = await supabase
    .from("tasks")
    .update(dbPatch)
    .eq("id", taskId)
    .select("*")
    .single();
  if (error) throw error;
  return fromDb(data as DbTask);
}

export async function deleteTask(taskId: string): Promise<void> {
  // Soft delete: keep ledger intact for stats.
  const { error } = await supabase
    .from("tasks")
    .update({ active: false })
    .eq("id", taskId);
  if (error) throw error;
}

export async function recordCompletion(
  userId: string,
  taskId: string,
  coins: number,
  xp: number,
): Promise<void> {
  const { error } = await supabase.from("task_completions").insert({
    user_id: userId,
    task_id: taskId,
    coins_earned: coins,
    xp_earned: xp,
  });
  if (error) throw error;
}

// Returns the most recent completion row for a task, or null if there is
// none. Used by uncompleteTask to know what payouts to reverse.
export async function fetchLatestCompletion(
  taskId: string,
): Promise<{ id: string; coins_earned: number; xp_earned: number; completed_at: string } | null> {
  const { data, error } = await supabase
    .from("task_completions")
    .select("id, coins_earned, xp_earned, completed_at")
    .eq("task_id", taskId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function deleteCompletionById(id: string): Promise<void> {
  const { error } = await supabase.from("task_completions").delete().eq("id", id);
  if (error) throw error;
}

// Returns the second-most-recent completion's timestamp (for back-filling
// task.last_completed_at after we delete the latest). Returns null when the
// task has no remaining completions.
export async function fetchPriorCompletionTime(
  taskId: string,
  excludeId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("task_completions")
    .select("completed_at")
    .eq("task_id", taskId)
    .neq("id", excludeId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data?.completed_at ?? null;
}
