// Horizontal "shelf" strip above the plant grid. Hosts placed decor items.
// In edit mode, placed sprites become tappable (tap → unplace, sends back to
// the tray) and empty slots get a dashed outline so the user can see where
// the next placement will land.

import * as React from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { DECOR_STRIP_SLOTS, getDecor } from "@/components/decor/catalog";
import { DecorSprite } from "@/components/decor/DecorSprite";
import type { Palette } from "@/theme/palettes";

type Props = {
  palette: Palette;
  /** Decor rows from the store, may include unplaced items (slotIndex === null). */
  decorOwned: Array<{ id: string; slotIndex: number | null }>;
  width: number;
  editMode: boolean;
  onUnplace: (decorId: string) => void;
};

export function GreenhouseDecorStrip({
  palette,
  decorOwned,
  width,
  editMode,
  onUnplace,
}: Props) {
  const slotW = Math.floor(width / DECOR_STRIP_SLOTS);
  const placedBySlot = React.useMemo(() => {
    const map = new Map<number, string>();
    for (const row of decorOwned) {
      if (row.slotIndex != null) map.set(row.slotIndex, row.id);
    }
    return map;
  }, [decorOwned]);

  return (
    <View style={[styles.row, { width }]} pointerEvents="box-none">
      {Array.from({ length: DECOR_STRIP_SLOTS }, (_, i) => {
        const decorId = placedBySlot.get(i);
        const entry = decorId ? getDecor(decorId) : undefined;
        return (
          <Pressable
            key={i}
            onPress={editMode && decorId ? () => onUnplace(decorId) : undefined}
            disabled={!editMode || !decorId}
            style={[
              styles.slot,
              {
                width: slotW - 2,
                height: slotW - 2,
                borderColor: editMode ? palette.line + "80" : "transparent",
                borderStyle: editMode ? "dashed" : "solid",
              },
            ]}
          >
            {entry && <DecorSprite entry={entry} palette={palette} scale={2} />}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  slot: {
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
