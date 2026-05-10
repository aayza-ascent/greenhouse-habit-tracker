// Chunky pixel button. Native equivalent of the prototype's `<button>` —
// chunky 4px bottom shadow that compresses to 2px on press. Border is
// faked with inset shadows to keep the pixel-RPG feel.
//
// React Native doesn't support multi-layer box-shadow on Android with the
// same fidelity as web, so we fall back to a stacked View structure: an
// outer translateY-on-press wrapper + a colored inner View with a flat
// shadow line via marginBottom + absolutely-positioned shadow strip.

import * as React from "react";
import { Pressable, Text, View, type PressableProps, type ViewStyle } from "react-native";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

type Size = "sm" | "md" | "lg";

type Props = Omit<PressableProps, "style" | "children"> & {
  palette: Palette;
  children: React.ReactNode;
  color?: string;
  fg?: string;
  size?: Size;
  disabled?: boolean;
  style?: ViewStyle;
};

const SIZE_PAD: Record<Size, { padY: number; padX: number; fs: number }> = {
  sm: { padY: 6, padX: 12, fs: 12 },
  md: { padY: 10, padX: 18, fs: 14 },
  lg: { padY: 14, padX: 22, fs: 18 },
};

export function PixelButton({
  palette,
  children,
  color,
  fg,
  size = "md",
  disabled,
  style,
  ...rest
}: Props) {
  const [pressed, setPressed] = React.useState(false);
  const { padY, padX, fs } = SIZE_PAD[size];
  const bg = disabled ? palette.inkSoft : color ?? palette.accent;
  const shadowOffset = pressed ? 2 : 4;

  return (
    <Pressable
      disabled={disabled}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      {...rest}
      style={[{ alignSelf: "stretch", marginBottom: 4, opacity: disabled ? 0.6 : 1 }, style]}
    >
      <View
        style={{
          backgroundColor: bg,
          paddingVertical: padY,
          paddingHorizontal: padX,
          borderWidth: 2,
          borderColor: palette.ink,
          transform: [{ translateY: pressed ? 2 : 0 }],
        }}
      >
        <Text
          style={{
            color: fg ?? "#fff",
            fontFamily: FONTS.bodySemibold,
            fontSize: fs,
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {typeof children === "string" ? children : null}
        </Text>
        {typeof children !== "string" ? children : null}
      </View>
      {/* Shadow strip — sits below the button to fake the chunky drop */}
      <View
        pointerEvents="none"
        style={{
          height: shadowOffset,
          backgroundColor: palette.ink,
          marginTop: -2,
          opacity: pressed ? 0.6 : 1,
        }}
      />
    </Pressable>
  );
}
