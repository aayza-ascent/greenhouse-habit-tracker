// Coin / XP economy. Lifted from greenhouse-prototype-design/project/store.jsx.
// These constants are the single source of truth on the client; the cron
// Edge Function mirrors them in SQL when awarding full-health bonuses.

export type Frequency = "daily" | "dow" | "weekly" | "monthly";

export const FREQ_COIN: Record<Frequency, number> = {
  daily: 5,
  dow: 8,
  weekly: 20,
  monthly: 70,
};

export const FREQ_XP: Record<Frequency, number> = {
  daily: 10,
  dow: 12,
  weekly: 30,
  monthly: 80,
};

// Streak multipliers — applied to coin payouts (and a smaller XP boost).
// 30+ day streak triples coins; 7+ day streak doubles them.
export function coinMultiplier(streak: number): number {
  if (streak >= 30) return 3;
  if (streak >= 7) return 2;
  return 1;
}

export function xpMultiplier(streak: number): number {
  return streak >= 7 ? 2 : 1;
}

export function payoutForCompletion(freq: Frequency, streak: number): {
  coins: number;
  xp: number;
} {
  return {
    coins: FREQ_COIN[freq] * coinMultiplier(streak),
    xp: FREQ_XP[freq] * xpMultiplier(streak),
  };
}

// Bonus paid when a plant has been at full health for 2+ consecutive ticks.
// Modest enough to not break the curve; meaningful enough to feel rewarded.
export const FULL_HEALTH_BONUS = { coins: 15, xp: 25 };

// Revival cost (also referenced in Shop's REVIVE tab).
export const REVIVE_COST_COINS = 25;
export const REVIVE_RESTORE_HEALTH = 50;
