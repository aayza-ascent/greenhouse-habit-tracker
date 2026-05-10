// Root route. Expo Router needs an explicit screen at "/" to mount anything
// inside the layout's Stack — without this file, navigating to "/" hits
// Expo Router's built-in Unmatched Route page.
//
// We render null and let app/_layout.tsx's auth-gate effect dispatch the
// real redirect (sign-in vs onboarding vs tabs) once session + profile
// resolve. The brief blank flash here is preferable to picking a destination
// before we know the auth state.

import { useRouter } from "expo-router";
import { useEffect } from "react";

import { supabase } from "@/data/supabase";

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    // Belt-and-braces: if the layout's redirect somehow hasn't fired by the
    // time we mount, kick the user to sign-in. The layout will correct to
    // /(tabs)/greenhouse if a session is actually present.
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) router.replace("/(tabs)/greenhouse");
      else router.replace("/(auth)/sign-in");
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
