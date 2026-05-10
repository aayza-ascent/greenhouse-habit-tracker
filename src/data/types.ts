// Domain types mirroring the Supabase schema. camelCase on the client; the
// data layer maps to/from the DB's snake_case at the boundary.

import type { Frequency } from "@/domain/economy";
import type { FlowerType } from "@/components/plants/flowers-v2";

export type PaletteKey = "terracotta" | "twilight" | "pastel";
export type TimeOfDay = "day" | "dusk" | "night";

export type Profile = {
  id: string;
  username: string | null;
  level: number;
  xp: number;
  coins: number;
  streak: number;
  paletteKey: PaletteKey;
  timeOfDay: TimeOfDay;
  gridCols: number;
  gridRows: number;
  tz: string;
  lastTickAt: string;
  onboarded: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  userId: string;
  name: string;
  icon: string;
  freq: Frequency;
  dows: number[]; // 1=Mon..7=Sun
  reminderTime: string | null; // 'HH:MM'
  durationMinutes: number;
  streak: number;
  lastCompletedAt: string | null;
  plantId: string | null;
  active: boolean;
  createdAt: string;
};

export type Plant = {
  id: string;
  userId: string;
  type: FlowerType;
  slotCol: number;
  slotRow: number;
  health: number;
  stageIdx: number;
  taskId: string | null;
  ticksAtFull: number;
  lastTickAt: string;
  createdAt: string;
};

export type TransactionKind =
  | "earn_task"
  | "spend_buy"
  | "spend_revive"
  | "streak_bonus"
  | "full_health_bonus";
