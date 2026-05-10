import { supabase } from "./supabase";

export type DecorOwnedRow = {
  decorId: string;
  slotIndex: number | null;
};

export async function listDecorOwned(userId: string): Promise<DecorOwnedRow[]> {
  const { data, error } = await supabase
    .from("decor_owned")
    .select("decor_id, slot_index")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { decor_id: string; slot_index: number | null }) => ({
    decorId: r.decor_id,
    slotIndex: r.slot_index,
  }));
}

export async function unlockDecor(userId: string, decorId: string): Promise<void> {
  const { error } = await supabase
    .from("decor_owned")
    .upsert({ user_id: userId, decor_id: decorId }, { onConflict: "user_id,decor_id" });
  if (error) throw error;
}

// Set or clear the strip slot for an owned decor row. Returns false if the
// target slot is already taken (caught via 23505 from the unique partial
// index) so the caller can degrade gracefully — UI should treat as no-op.
export async function placeDecor(
  userId: string,
  decorId: string,
  slotIndex: number | null,
): Promise<boolean> {
  const { error } = await supabase
    .from("decor_owned")
    .update({ slot_index: slotIndex })
    .eq("user_id", userId)
    .eq("decor_id", decorId);
  if (!error) return true;
  if ((error as { code?: string }).code === "23505") return false;
  throw error;
}
