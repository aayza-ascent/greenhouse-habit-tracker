import { supabase } from "./supabase";
import type { TransactionKind } from "./types";

export type RecordTxInput = {
  kind: TransactionKind;
  deltaCoins?: number;
  deltaXp?: number;
  refId?: string | null;
};

export async function recordTransaction(
  userId: string,
  input: RecordTxInput,
): Promise<void> {
  const { error } = await supabase.from("transactions").insert({
    user_id: userId,
    kind: input.kind,
    delta_coins: input.deltaCoins ?? 0,
    delta_xp: input.deltaXp ?? 0,
    ref_id: input.refId ?? null,
  });
  if (error) throw error;
}

// Day-by-day completion histogram for the Stats heatmap.
// Returns a map of `YYYY-MM-DD` (in user tz) → count.
export async function fetchCompletionsByDay(
  userId: string,
  sinceISO: string,
): Promise<{ completed_at: string }[]> {
  const { data, error } = await supabase
    .from("task_completions")
    .select("completed_at")
    .eq("user_id", userId)
    .gte("completed_at", sinceISO)
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as { completed_at: string }[];
}
