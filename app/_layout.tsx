import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import { FONT_MAP } from "@/theme/fonts";
import { supabase } from "@/data/supabase";
import { useSyncStore } from "@/store/sync";
import { useGameStore } from "@/store/useGameStore";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts(FONT_MAP);
  const [session, setSession] = useState<Session | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setSessionResolved(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useSyncStore(session);

  useEffect(() => {
    if (!fontsLoaded || !sessionResolved) return;
    SplashScreen.hideAsync();
  }, [fontsLoaded, sessionResolved]);

  const profile = useGameStore((s) => s.profile);

  useEffect(() => {
    if (!sessionResolved) return;
    const root = String(segments[0] ?? "");
    if (root === "dev") return; // /dev/* skips the auth gate for visual-diff work
    const inAuthGroup = root === "(auth)";
    const onOnboarding = root === "onboarding";
    if (!session && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
      return;
    }
    if (session && inAuthGroup) {
      router.replace("/(tabs)/greenhouse");
      return;
    }
    // Once profile loads, send unonboarded users through onboarding.
    if (session && profile && !profile.onboarded && !onOnboarding) {
      router.replace("/onboarding");
      return;
    }
    if (session && profile?.onboarded && onOnboarding) {
      router.replace("/(tabs)/greenhouse");
    }
  }, [session, sessionResolved, segments, profile?.onboarded]);

  if (!fontsLoaded || !sessionResolved) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen
          name="new-task"
          options={{ presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="dev/plant-reference" />
      </Stack>
    </GestureHandlerRootView>
  );
}
