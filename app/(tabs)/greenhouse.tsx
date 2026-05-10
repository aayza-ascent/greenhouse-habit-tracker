// Greenhouse hero — sky + decor strip + plant grid. Two visual modes:
//   • Regular: clean view — just plants + placed decor.
//   • Edit:    + slots in the plant grid, decor tray under the strip,
//              tap-to-place / tap-to-unplace decor interactions enabled.
//
// Plant drag-rearrange works in both modes (rearranging is non-destructive).
// Tapping a plant in either mode opens the info / revive modal.

import * as React from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { useRouter } from "expo-router";

import {
  GreenhouseGrid,
  SLOT_BASE_H,
  SLOT_BASE_W,
} from "@/components/GreenhouseGrid";
import { GreenhouseDecorStrip } from "@/components/GreenhouseDecorStrip";
import { GreenhouseDecorTray } from "@/components/GreenhouseDecorTray";
import { GreenhouseSky } from "@/components/GreenhouseSky";
import { HUD } from "@/components/ui/HUD";
import { PlantInfoModal } from "@/components/PlantInfoModal";
import { useGameStore } from "@/store/useGameStore";
import { REVIVE_COST_COINS } from "@/domain/economy";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";
import type { Plant as PlantRow } from "@/data/types";

const SCREEN_PADDING = 28; // 14 each side

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
  const decorOwned = useGameStore((s) => s.decorOwned);
  const movePlant = useGameStore((s) => s.movePlant);
  const revivePlant = useGameStore((s) => s.revivePlant);
  const placeDecor = useGameStore((s) => s.placeDecor);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const time = profile?.timeOfDay ?? "day";
  const cols = profile?.gridCols ?? 6;
  const rows = profile?.gridRows ?? 6;

  const slotW = Math.min(SLOT_BASE_W, Math.floor((screenW - SCREEN_PADDING) / cols));
  const slotH = Math.round(slotW * (SLOT_BASE_H / SLOT_BASE_W));
  const plantScale = spriteScaleForSlot(slotW);
  const stripWidth = slotW * cols;

  const [editMode, setEditMode] = React.useState(false);
  const [tip, setTip] = React.useState<PlantRow | null>(null);
  const linkedTask = tip ? tasks.find((t) => t.id === tip.taskId) ?? null : null;

  return (
    <View style={[styles.root, { backgroundColor: palette.bgWall }]}>
      <GreenhouseSky palette={palette} time={time} height={130} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.title,
              {
                color: editMode ? palette.accent : palette.ink,
                fontFamily: FONTS.displayBold,
              },
            ]}
          >
            {editMode ? "EDITING" : "MY GREENHOUSE"}
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

      {/* Dedicated action row — keeps the EDIT button on its own line so it's
          easy to find regardless of how wide the HUD is. */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => setEditMode((v) => !v)}
          style={[
            styles.editBtn,
            {
              backgroundColor: editMode ? palette.accent : palette.bgPanel,
              borderColor: palette.ink,
            },
          ]}
        >
          <Text
            style={[
              styles.editBtnText,
              {
                color: editMode ? "#fff" : palette.ink,
                fontFamily: FONTS.displayBold,
              },
            ]}
          >
            {editMode ? "✓  DONE EDITING" : "✎  EDIT GREENHOUSE"}
          </Text>
        </Pressable>
      </View>

      <View style={styles.gridArea}>
        <View
          pointerEvents="none"
          style={[
            styles.floor,
            { backgroundColor: palette.bgFloor, borderTopColor: palette.line },
          ]}
        />

        {/* Decor strip — visible in both modes; only edit-mode taps unplace. */}
        <View style={[styles.stripWrap, { width: stripWidth }]}>
          <GreenhouseDecorStrip
            palette={palette}
            decorOwned={decorOwned}
            width={stripWidth}
            editMode={editMode}
            onUnplace={(decorId) => placeDecor(decorId, null)}
          />
        </View>

        {/* Tray — edit-mode only. Sits between strip and plant grid. */}
        {editMode && (
          <View style={[styles.trayWrap, { width: stripWidth }]}>
            <GreenhouseDecorTray
              palette={palette}
              decorOwned={decorOwned}
              onPlace={(decorId, slotIndex) => placeDecor(decorId, slotIndex)}
            />
          </View>
        )}

        <View style={styles.gridWrap}>
          <GreenhouseGrid
            palette={palette}
            plants={plants}
            cols={cols}
            rows={rows}
            slotW={slotW}
            slotH={slotH}
            plantScale={plantScale}
            editMode={editMode}
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
    gap: 8,
  },
  title: { fontSize: 18, letterSpacing: 1 },
  sub: { fontSize: 12, marginTop: 2 },
  actionRow: {
    paddingHorizontal: 14,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "flex-end",
    zIndex: 5,
  },
  editBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderWidth: 2,
  },
  editBtnText: { fontSize: 12, letterSpacing: 1 },
  gridArea: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    paddingTop: 16,
  },
  floor: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
    borderTopWidth: 3,
  },
  stripWrap: { marginBottom: 8 },
  trayWrap: { marginBottom: 8 },
  gridWrap: { marginBottom: 22 },
});
