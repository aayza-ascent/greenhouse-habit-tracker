// Wilt-alert push fan-out. Deploy as a Supabase Edge Function (Deno):
//
//   supabase functions deploy wilt-alert --no-verify-jwt
//
// Wire it as a pg_cron schedule that runs after tick_all_users:
//
//   select cron.schedule(
//     'greenhouse-wilt-alert',
//     '5 * * * *',
//     $$select net.http_post(
//        url := 'https://<project>.functions.supabase.co/wilt-alert',
//        headers := jsonb_build_object(
//          'Authorization', 'Bearer <SERVICE_ROLE_KEY>',
//          'Content-Type', 'application/json'
//        )
//      )$$
//   );
//
// The function reads plants whose stage_idx just entered the wilting band
// (8-10) within the last hour, looks up the owner's push tokens, and sends
// a notification via Expo's push API.

// @ts-expect-error — Deno globals only resolve in Edge Function runtime.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

// @ts-expect-error
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// @ts-expect-error
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

type Plant = {
  id: string;
  user_id: string;
  type: string;
  stage_idx: number;
  last_tick_at: string;
};

// @ts-expect-error
Deno.serve(async () => {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: wilting, error } = await supabase
    .from("plants")
    .select("id, user_id, type, stage_idx, last_tick_at")
    .gte("stage_idx", 8)
    .lte("stage_idx", 10)
    .gte("last_tick_at", oneHourAgo);
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  const byUser = new Map<string, Plant[]>();
  for (const p of (wilting ?? []) as Plant[]) {
    const arr = byUser.get(p.user_id) ?? [];
    arr.push(p);
    byUser.set(p.user_id, arr);
  }

  const messages: Array<Record<string, unknown>> = [];
  for (const [userId, plants] of byUser) {
    const { data: tokens } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", userId);
    if (!tokens?.length) continue;
    const body =
      plants.length === 1
        ? `Your ${plants[0].type} is wilting. Tend it before it dies.`
        : `${plants.length} of your plants are wilting. Tend them before they die.`;
    for (const { token } of tokens) {
      messages.push({
        to: token,
        title: "🍂 Greenhouse needs you",
        body,
        sound: "default",
        priority: "high",
      });
    }
  }

  if (messages.length === 0) {
    return new Response(JSON.stringify({ sent: 0 }), { status: 200 });
  }

  // Expo Push API accepts up to 100 messages per request.
  const chunks: Array<Array<Record<string, unknown>>> = [];
  for (let i = 0; i < messages.length; i += 100) chunks.push(messages.slice(i, i + 100));

  let sent = 0;
  for (const chunk of chunks) {
    const r = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(chunk),
    });
    if (r.ok) sent += chunk.length;
  }

  return new Response(JSON.stringify({ sent }), { status: 200 });
});
