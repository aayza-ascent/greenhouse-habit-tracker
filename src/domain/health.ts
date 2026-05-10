// Plant health → stage derivation. The 12-stage life cycle from
// greenhouse-prototype-design/project/flowers-v2.jsx is canonical; this
// function maps a (health, streak, ticksAtFull) triple to a stage index.
//
// Used by both the client (optimistic UI after task completion) and the
// nightly cron Edge Function (authoritative). The SQL mirror lives in
// supabase/migrations/*; if you change the bands here, update both.

import type { Frequency } from "./economy";

export const STAGE_NAMES = [
  "seeded", // 0
  "sprouting", // 1
  "growing", // 2
  "budding", // 3
  "flowering", // 4
  "fully flowered", // 5
  "thriving", // 6
  "extra thriving", // 7
  "wilting", // 8
  "sad wilting", // 9
  "dying", // 10
  "dead", // 11
] as const;

export type StageIdx = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;

export const STARTING_HEALTH = 50;
export const COMPLETION_HEALTH_BUMP = 12;

// Decay scales by frequency: daily tasks decay fastest, monthly slowest.
// Tuning these is the main lever for "how forgiving is the game?"
export const DECAY_PER_MISS: Record<Frequency, number> = {
  daily: 15,
  dow: 12,
  weekly: 8,
  monthly: 5,
};

export function stageFromHealth(
  health: number,
  streak: number,
  ticksAtFull: number,
): StageIdx {
  // Death and decline bands are health-only.
  if (health <= 19) return 11; // dead
  if (health <= 29) return 10; // dying
  if (health <= 39) return 9; // sad wilting
  if (health <= 49) return 8; // wilting

  // Healthy range — every flowering band is gated on streak so a brand-new
  // plant with high health (e.g. health 62 after one completion) doesn't
  // skip ahead to "flowering". Per spec: flowering needs 3+ streak.
  if (health >= 96 && streak >= 7 && ticksAtFull >= 2) return 7; // extra thriving
  if (health >= 80 && streak >= 7) return 6; // thriving
  if (health >= 70 && streak >= 3) return 5; // fully flowered
  if (health >= 60 && streak >= 3) return 4; // flowering
  if (health >= 50 && streak >= 3) return 3; // budding
  if (streak >= 2) return 2; // growing
  if (streak >= 1) return 1; // sprouting
  return 0; // seeded
}

export function applyCompletion(health: number): number {
  return Math.min(100, health + COMPLETION_HEALTH_BUMP);
}

export function applyMiss(health: number, freq: Frequency): number {
  return Math.max(0, health - DECAY_PER_MISS[freq]);
}
