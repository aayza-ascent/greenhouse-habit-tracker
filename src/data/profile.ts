import { supabase } from "./supabase";
import type { PaletteKey, Profile, TimeOfDay } from "./types";

type DbProfile = {
  id: string;
  username: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  palette_key: PaletteKey;
  time_of_day: TimeOfDay;
  grid_cols: number;
  grid_rows: number;
  tz: string;
  last_tick_at: string;
  onboarded: boolean;
  created_at: string;
  updated_at: string;
};

const fromDb = (p: DbProfile): Profile => ({
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

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) {
    if (error.code === "PGRST116") return null; // no rows
    throw error;
  }
  return fromDb(data as DbProfile);
}

export async function updateProfile(
  userId: string,
  patch: Partial<{
    username: string;
    coins: number;
    xp: number;
    level: number;
    streak: number;
    paletteKey: PaletteKey;
    timeOfDay: TimeOfDay;
    gridCols: number;
    gridRows: number;
    tz: string;
    onboarded: boolean;
  }>,
): Promise<Profile> {
  const dbPatch: Record<string, unknown> = {};
  if (patch.username !== undefined) dbPatch.username = patch.username;
  if (patch.coins !== undefined) dbPatch.coins = patch.coins;
  if (patch.xp !== undefined) dbPatch.xp = patch.xp;
  if (patch.level !== undefined) dbPatch.level = patch.level;
  if (patch.streak !== undefined) dbPatch.streak = patch.streak;
  if (patch.paletteKey !== undefined) dbPatch.palette_key = patch.paletteKey;
  if (patch.timeOfDay !== undefined) dbPatch.time_of_day = patch.timeOfDay;
  if (patch.gridCols !== undefined) dbPatch.grid_cols = patch.gridCols;
  if (patch.gridRows !== undefined) dbPatch.grid_rows = patch.gridRows;
  if (patch.tz !== undefined) dbPatch.tz = patch.tz;
  if (patch.onboarded !== undefined) dbPatch.onboarded = patch.onboarded;
  const { data, error } = await supabase
    .from("profiles")
    .update(dbPatch)
    .eq("id", userId)
    .select("*")
    .single();
  if (error) throw error;
  return fromDb(data as DbProfile);
}
