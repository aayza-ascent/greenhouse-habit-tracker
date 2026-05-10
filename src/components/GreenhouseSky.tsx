// Sky band shown above the greenhouse floor. Gradient + sun/moon/stars/
// fireflies depending on time-of-day. Ported from
// greenhouse-prototype-design/project/screens.jsx → GreenhouseSky.

import * as React from "react";
import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { MoonIcon, StarIcon, SunIcon } from "./ui/icons";
import type { Palette } from "@/theme/palettes";
import type { TimeOfDay } from "@/data/types";

type Props = {
  palette: Palette;
  time: TimeOfDay;
  height?: number;
};

const STAR_POSITIONS: Array<[number, number, number]> = [
  [50, 22, 1.4],
  [110, 16, 1],
  [180, 30, 1.2],
  [240, 18, 1],
  [300, 36, 1.4],
  [60, 50, 1.1],
  [320, 60, 1],
];

export function GreenhouseSky({ palette, time, height = 130 }: Props) {
  const day = time === "day";
  const dusk = time === "dusk";
  const skyTop = day ? palette.sky : dusk ? "#f0a868" : palette.night1;
  const skyMid = day ? "#bce4f5" : dusk ? "#e87a4a" : palette.night2;
  const skyBot = day ? "#dff0e0" : dusk ? "#5a3a6a" : palette.nightTint;
  return (
    <View style={[styles.root, { height }]} pointerEvents="none">
      <LinearGradient
        colors={[skyTop, skyMid, skyBot]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={[styles.celestial, { top: 14, right: 22 }]}>
        {time === "night" ? (
          <MoonIcon palette={palette} scale={3} />
        ) : (
          <SunIcon palette={palette} scale={3} />
        )}
      </View>
      {time === "night" &&
        STAR_POSITIONS.map(([x, y, s], i) => (
          <View key={i} style={[styles.star, { left: x, top: y }]}>
            <StarIcon palette={palette} scale={s} />
          </View>
        ))}
      {dusk && (
        <>
          {[
            [80, 50],
            [200, 70],
            [280, 60],
          ].map(([x, y], i) => (
            <View
              key={i}
              style={[styles.firefly, { left: x, top: y, backgroundColor: palette.coin }]}
            />
          ))}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: "absolute", left: 0, right: 0, top: 0, overflow: "hidden" },
  celestial: { position: "absolute" },
  star: { position: "absolute", opacity: 0.9 },
  firefly: { position: "absolute", width: 4, height: 4, borderRadius: 1 },
});
