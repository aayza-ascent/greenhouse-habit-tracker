import { supabase } from "./supabase";
import type { FlowerType } from "@/components/plants/flowers-v2";

export async function listInventory(userId: string): Promise<FlowerType[]> {
  const { data, error } = await supabase
    .from("inventory_owned")
    .select("plant_type")
    .eq("user_id", userId);
  if (error) throw error;
  return (data ?? []).map((r: { plant_type: FlowerType }) => r.plant_type);
}

export async function unlockPlant(userId: string, plantType: FlowerType): Promise<void> {
  const { error } = await supabase
    .from("inventory_owned")
    .upsert({ user_id: userId, plant_type: plantType }, { onConflict: "user_id,plant_type" });
  if (error) throw error;
}
