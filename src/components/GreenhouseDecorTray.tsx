// Edit-mode-only tray of unplaced owned decor. Tapping a decor finds the
// first empty strip slot and places it there; if the strip is full, surfaces
// a brief "Strip is full" hint and no-ops.
//
// Empty state shows a friendly nudge to /(tabs)/shop.

import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import {
  DECOR_CATALOG,
  DECOR_STRIP_SLOTS,
  getDecor,
} from "@/components/decor/catalog";
import { DecorSprite } from "@/components/decor/DecorSprite";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

type Props = {
  palette: Palette;
  decorOwned: Array<{ id: string; slotIndex: number | null }>;
  onPlace: (decorId: string, slotIndex: number) => void;
};

export function GreenhouseDecorTray({ palette, decorOwned, onPlace }: Props) {
  const [hint, setHint] = React.useState<string | null>(null);

  const unplaced = decorOwned.filter((d) => d.slotIndex == null);
  const occupiedSlots = new Set(
    decorOwned.map((d) => d.slotIndex).filter((s): s is number => s != null),
  );

  const tryPlace = (decorId: string) => {
    let slot: number | null = null;
    for (let i = 0; i < DECOR_STRIP_SLOTS; i++) {
      if (!occupiedSlots.has(i)) {
        slot = i;
        break;
      }
    }
    if (slot == null) {
      setHint("Strip is full — unplace something first.");
      setTimeout(() => setHint(null), 1500);
      return;
    }
    onPlace(decorId, slot);
  };

  if (decorOwned.length === 0) {
    return (
      <View
        style={[
          styles.empty,
          { backgroundColor: palette.bgPanel + "cc", borderColor: palette.line },
        ]}
      >
        <Text
          style={[styles.emptyText, { color: palette.inkSoft, fontFamily: FONTS.body }]}
        >
          No decor yet.{" "}
          <Link href="/(tabs)/shop">
            <Text style={{ color: palette.accent, fontFamily: FONTS.bodySemibold }}>
              Visit the shop →
            </Text>
          </Link>
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text
          style={[
            styles.headerLabel,
            { color: palette.inkSoft, fontFamily: FONTS.displayBold },
          ]}
        >
          DECOR TRAY
        </Text>
        {hint && (
          <Text
            style={[
              styles.hint,
              { color: palette.accent, fontFamily: FONTS.body },
            ]}
          >
            {hint}
          </Text>
        )}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {unplaced.length === 0 ? (
          <Text
            style={[styles.allPlaced, { color: palette.inkSoft, fontFamily: FONTS.body }]}
          >
            All your decor is placed.
          </Text>
        ) : (
          unplaced.map((row) => {
            const entry = getDecor(row.id) ?? DECOR_CATALOG.find((d) => d.id === row.id);
            if (!entry) return null;
            return (
              <Pressable
                key={row.id}
                onPress={() => tryPlace(row.id)}
                style={[
                  styles.trayItem,
                  { backgroundColor: palette.bgPanel, borderColor: palette.ink },
                ]}
              >
                <DecorSprite entry={entry} palette={palette} scale={2} />
                <Text
                  style={[
                    styles.trayLabel,
                    { color: palette.ink, fontFamily: FONTS.body },
                  ]}
                >
                  {entry.name}
                </Text>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 6,
  },
  headerLabel: { fontSize: 10, letterSpacing: 1 },
  hint: { fontSize: 11 },
  scroll: { gap: 8, paddingRight: 16 },
  trayItem: {
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: "center",
    minWidth: 64,
  },
  trayLabel: { fontSize: 9, marginTop: 2, textAlign: "center" },
  empty: {
    padding: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
  },
  emptyText: { fontSize: 13 },
  allPlaced: { fontSize: 12, fontStyle: "italic", paddingVertical: 8 },
});
