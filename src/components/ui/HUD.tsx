// Coin / XP / streak HUD pill row. Shown in the top-right of every tab.

import * as React from "react";
import { StyleSheet, Text, View } from "react-native";
import { CoinIcon, XPIcon } from "./icons";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

export function HUD({
  palette,
  coins,
  xp,
  streak,
}: {
  palette: Palette;
  coins: number;
  xp: number;
  streak: number;
}) {
  return (
    <View style={styles.row}>
      <Pill palette={palette} icon={<CoinIcon palette={palette} scale={2} />} value={coins} />
      <Pill
        palette={palette}
        icon={<XPIcon palette={palette} scale={2} />}
        value={xp}
        valueColor={palette.accentB}
      />
      <Pill
        palette={palette}
        icon={<Text style={{ fontSize: 14 }}>🔥</Text>}
        value={streak}
        valueColor={palette.accent}
      />
    </View>
  );
}

function Pill({
  palette,
  icon,
  value,
  valueColor,
}: {
  palette: Palette;
  icon: React.ReactNode;
  value: number;
  valueColor?: string;
}) {
  return (
    <View
      style={[
        styles.pill,
        { backgroundColor: palette.bgPanel, borderColor: palette.ink },
      ]}
    >
      {icon}
      <Text
        style={[
          styles.value,
          { color: valueColor ?? palette.ink, fontFamily: FONTS.displayBold },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 2,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  value: { fontSize: 14 },
});
