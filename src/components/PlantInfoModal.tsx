// Tap-on-plant info popup. Shows name, stage, health bar, the task that
// "feeds" the plant, and a revive button when stage=dead.

import * as React from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { Plant } from "@/components/plants/Plant";
import { FLOWERS_V2 } from "@/components/plants/flowers-v2";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { REVIVE_COST_COINS } from "@/domain/economy";
import { STAGE_NAMES } from "@/domain/health";
import type { Plant as PlantRow, Task } from "@/data/types";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

type Props = {
  visible: boolean;
  plant: PlantRow | null;
  task: Task | null;
  palette: Palette;
  canRevive: boolean;
  onRevive: () => void;
  onClose: () => void;
};

export function PlantInfoModal({
  visible,
  plant,
  task,
  palette,
  canRevive,
  onRevive,
  onClose,
}: Props) {
  if (!plant) return null;
  const isDead = plant.stageIdx === 11;
  const healthColor =
    plant.health > 70 ? palette.leafL : plant.health > 49 ? palette.coin : palette.accent;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={(e) => e.stopPropagation()} style={{ width: 320 }}>
          <PixelPanel palette={palette} pad={16}>
            <View style={styles.row}>
              <Plant type={plant.type} stage={plant.stageIdx} scale={3} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text
                  style={[styles.name, { color: palette.ink, fontFamily: FONTS.displayBold }]}
                >
                  {FLOWERS_V2[plant.type].name}
                </Text>
                <Text
                  style={[styles.stageLabel, { color: palette.inkSoft, fontFamily: FONTS.body }]}
                >
                  {(STAGE_NAMES[plant.stageIdx] ?? "").toUpperCase()}
                </Text>
                <View
                  style={[
                    styles.healthOuter,
                    { backgroundColor: palette.line + "55" },
                  ]}
                >
                  <View
                    style={[
                      styles.healthInner,
                      {
                        backgroundColor: healthColor,
                        width: `${plant.health}%`,
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.healthText,
                    { color: palette.inkSoft, fontFamily: FONTS.body },
                  ]}
                >
                  {plant.health}/100 health
                </Text>
              </View>
            </View>
            {task && (
              <View
                style={[
                  styles.linkBox,
                  { backgroundColor: palette.bgPanel2, borderColor: palette.line },
                ]}
              >
                <Text style={[styles.linkLabel, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
                  FED BY
                </Text>
                <Text style={[styles.linkName, { color: palette.ink, fontFamily: FONTS.body }]}>
                  {task.icon} {task.name}
                </Text>
                <Text
                  style={[styles.linkMeta, { color: palette.inkSoft, fontFamily: FONTS.body }]}
                >
                  🔥 {task.streak}-day streak
                </Text>
              </View>
            )}
            {isDead && (
              <PixelButton
                palette={palette}
                disabled={!canRevive}
                onPress={onRevive}
                style={{ marginTop: 12 }}
              >
                {canRevive
                  ? `REVIVE FOR ${REVIVE_COST_COINS}🪙`
                  : `NEED ${REVIVE_COST_COINS}🪙`}
              </PixelButton>
            )}
          </PixelPanel>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000077",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 96,
  },
  row: { flexDirection: "row", alignItems: "center" },
  name: { fontSize: 16 },
  stageLabel: { fontSize: 12, marginTop: 2, letterSpacing: 1 },
  healthOuter: { marginTop: 6, height: 6 },
  healthInner: { height: "100%" },
  healthText: { fontSize: 11, marginTop: 4 },
  linkBox: {
    marginTop: 12,
    padding: 10,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  linkLabel: { fontSize: 11, letterSpacing: 1 },
  linkName: { fontSize: 16, marginTop: 2 },
  linkMeta: { fontSize: 12, marginTop: 2 },
});
