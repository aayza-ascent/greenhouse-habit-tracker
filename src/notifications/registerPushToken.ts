// Registers an Expo push token for the current device with Supabase. Called
// once after sign-in. Idempotent — safe to call repeatedly. No-ops in
// environments where remote push isn't available (web, Expo Go) so the
// rest of the app boots cleanly.
//
// The wilt-alert Edge Function (supabase/functions/wilt-alert/) reads tokens
// from public.push_tokens and sends via Expo Push API.

import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { Platform } from "react-native";

import { supabase } from "@/data/supabase";

// Constants.appOwnership is "expo" inside the Expo Go shell, "standalone" /
// "guest" inside dev/production builds. Expo Go since SDK 53 cannot mint
// real push tokens — calling getExpoPushTokenAsync there throws.
const isExpoGo = Constants.appOwnership === "expo";

export async function registerPushToken(userId: string): Promise<string | null> {
  if (Platform.OS === "web") return null; // Expo push doesn't ship to web.
  if (isExpoGo) {
    // Local notifications still work for testing; remote push needs a dev/prod build.
    return null;
  }

  try {
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
    if (!projectId) {
      // No EAS project linked yet — getExpoPushTokenAsync would error. Skip.
      return null;
    }
    const result = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = result.data;
    await supabase
      .from("push_tokens")
      .upsert(
        { user_id: userId, token, platform: Platform.OS as "ios" | "android" },
        { onConflict: "user_id,token" },
      );
    return token;
  } catch (e) {
    console.warn("[push-token] registration failed", e);
    return null;
  }
}
