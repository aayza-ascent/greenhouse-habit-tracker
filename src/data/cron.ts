import { supabase } from "./supabase";

// Manually run the per-user tick. Useful for QA via the dev "Skip a day"
// button on Profile. Pretends the next tick is "tomorrow" by passing now+24h
// so even today's daily tasks count as missed.
export async function devSkipADay(userId: string): Promise<void> {
  const fakeNow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.rpc("tick_user_plants", {
    p_user: userId,
    p_now: fakeNow,
  });
  if (error) throw error;
}
