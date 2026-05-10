// Registers an Expo push token for the current device with Supabase. Called
// once after sign-in. Idempotent — safe to call repeatedly.
//
// The wilt-alert Edge Function (supabase/functions/wilt-alert/) reads tokens
// from public.push_tokens and sends via Expo Push API.

import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "@/data/supabase";

export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null; // Expo push doesn't ship to web.
  const { status: existing } = await Notifications.getPermissionsAsync();
  let granted = existing === "granted";
  if (!granted) {
    const req = await Notifications.requestPermissionsAsync();
    granted = req.status === "granted";
  }
  if (!granted) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;
  const result = await Notifications.getExpoPushTokenAsync(
    projectId ? { projectId } : undefined,
  );
  const token = result.data;
  await supabase
    .from("push_tokens")
    .upsert(
      { user_id: userId, token, platform: Platform.OS as "ios" | "android" },
      { onConflict: "user_id,token" },
    );
  return token;
}
