import { Tabs } from "expo-router";

import { CelebrationOverlay } from "@/components/CelebrationOverlay";
import { TabIcon } from "@/components/ui/icons";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function TabsLayout() {
  const profile = useGameStore((s) => s.profile);
  const p = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: p.accent,
          tabBarInactiveTintColor: p.inkSoft,
          tabBarStyle: {
            backgroundColor: p.bgPanel,
            borderTopColor: p.ink,
            borderTopWidth: 2,
          },
          tabBarLabelStyle: { fontFamily: FONTS.bodySemibold, fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="greenhouse"
          options={{
            title: "Greenhouse",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="greenhouse" active={focused} palette={p} scale={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="tasks"
          options={{
            title: "Tasks",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="tasks" active={focused} palette={p} scale={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="shop"
          options={{
            title: "Shop",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="shop" active={focused} palette={p} scale={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            title: "Stats",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="stats" active={focused} palette={p} scale={2} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "You",
            tabBarIcon: ({ focused }) => (
              <TabIcon name="profile" active={focused} palette={p} scale={2} />
            ),
          }}
        />
      </Tabs>
      <CelebrationOverlay palette={p} />
    </>
  );
}
