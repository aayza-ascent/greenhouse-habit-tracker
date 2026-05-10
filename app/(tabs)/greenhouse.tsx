// Greenhouse hero — sky + floor + 6×6 grid of plants. Drag to rearrange,
// tap to inspect. Empty slots route to the shop.
//
// Ported from greenhouse-prototype-design/project/screens.jsx → GreenhouseScreen.

import * as React from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";

import {
  GreenhouseGrid,
  SLOT_BASE_H,
  SLOT_BASE_W,
} from "@/components/GreenhouseGrid";
import { GreenhouseSky } from "@/components/GreenhouseSky";
import { HUD } from "@/components/ui/HUD";
import { PlantInfoModal } from "@/components/PlantInfoModal";
import { useGameStore } from "@/store/useGameStore";
import { REVIVE_COST_COINS } from "@/domain/economy";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";
import type { Plant as PlantRow } from "@/data/types";

const SCREEN_PADDING = 28; // 14 each side

// Sprite is 28 px wide; SLOT_BASE_W is 50; default scale was 3 (84 px wide,
// scaled inside a 50-wide slot via centering). When we shrink the slot, we
// scale the sprite proportionally to keep visuals balanced.
function spriteScaleForSlot(slotW: number): number {
  const ratio = slotW / SLOT_BASE_W;
  return Math.max(1.5, Math.round(ratio * 3 * 2) / 2);
}

export default function GreenhouseScreen() {
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const profile = useGameStore((s) => s.profile);
  const plants = useGameStore((s) => s.plants);
  const tasks = useGameStore((s) => s.tasks);
  const movePlant = useGameStore((s) => s.movePlant);
  const revivePlant = useGameStore((s) => s.revivePlant);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const time = profile?.timeOfDay ?? "day";
  const cols = profile?.gridCols ?? 6;
  const rows = profile?.gridRows ?? 6;

  // Fit the grid to the screen. Cap at the prototype's 50×64 so 4×3 doesn't
  // look comically large on a tablet.
  const slotW = Math.min(SLOT_BASE_W, Math.floor((screenW - SCREEN_PADDING) / cols));
  const slotH = Math.round(slotW * (SLOT_BASE_H / SLOT_BASE_W));
  const plantScale = spriteScaleForSlot(slotW);

  const [tip, setTip] = React.useState<PlantRow | null>(null);
  const linkedTask = tip ? tasks.find((t) => t.id === tip.taskId) ?? null : null;

  return (
    <View style={[styles.root, { backgroundColor: palette.bgWall }]}>
      <GreenhouseSky palette={palette} time={time} height={130} />

      <View style={styles.headerRow}>
        <View>
          <Text
            style={[styles.title, { color: palette.ink, fontFamily: FONTS.displayBold }]}
          >
            MY GREENHOUSE
          </Text>
          <Text style={[styles.sub, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
            Lv.{profile?.level ?? 1} · {plants.length} plants
          </Text>
        </View>
        <HUD
          palette={palette}
          coins={profile?.coins ?? 0}
          xp={profile?.xp ?? 0}
          streak={profile?.streak ?? 0}
        />
      </View>

      <View style={styles.gridArea}>
        {/* Floor planks */}
        <View
          pointerEvents="none"
          style={[
            styles.floor,
            {
              backgroundColor: palette.bgFloor,
              borderTopColor: palette.line,
            },
          ]}
        />
        <View style={styles.gridWrap}>
          <GreenhouseGrid
            palette={palette}
            plants={plants}
            cols={cols}
            rows={rows}
            slotW={slotW}
            slotH={slotH}
            plantScale={plantScale}
            onTapPlant={setTip}
            onMovePlant={movePlant}
            onTapEmpty={() => router.push("/new-task")}
          />
        </View>
      </View>

      <PlantInfoModal
        visible={!!tip}
        plant={tip}
        task={linkedTask}
        palette={palette}
        canRevive={(profile?.coins ?? 0) >= REVIVE_COST_COINS}
        onClose={() => setTip(null)}
        onRevive={async () => {
          if (!tip) return;
          await revivePlant(tip.id);
          setTip(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, position: "relative", overflow: "hidden" },
  headerRow: {
    paddingHorizontal: 14,
    paddingTop: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    zIndex: 5,
  },
  title: { fontSize: 18, letterSpacing: 1 },
  sub: { fontSize: 12, marginTop: 2 },
  gridArea: { flex: 1, justifyContent: "flex-end", alignItems: "center" },
  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    borderTopWidth: 3,
  },
  gridWrap: { marginBottom: 22 },
});
