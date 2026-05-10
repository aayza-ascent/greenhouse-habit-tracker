// Chunky pixel panel — bordered container with a 3px bottom shadow.
// Stand-in for the prototype's PixelPanel <div>.

import * as React from "react";
import { View, type ViewStyle } from "react-native";
import type { Palette } from "@/theme/palettes";

type Props = {
  palette: Palette;
  color?: string;
  pad?: number;
  style?: ViewStyle;
  children: React.ReactNode;
};

export function PixelPanel({ palette, color, pad = 12, style, children }: Props) {
  return (
    <View style={{ marginBottom: 3 }}>
      <View
        style={[
          {
            backgroundColor: color ?? palette.bgPanel,
            padding: pad,
            borderWidth: 2,
            borderColor: palette.ink,
          },
          style,
        ]}
      >
        {children}
      </View>
      <View pointerEvents="none" style={{ height: 3, backgroundColor: palette.ink }} />
    </View>
  );
}
