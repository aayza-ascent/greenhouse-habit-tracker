// Font loading via expo-font + Google Fonts. Three families drive the pixel-RPG look:
//   Pixelify Sans — body / UI text
//   Silkscreen    — display / headers / monospace stat readouts
//   VT323         — mono-style, used sparingly for numeric callouts

import {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
} from "@expo-google-fonts/pixelify-sans";
import {
  Silkscreen_400Regular,
  Silkscreen_700Bold,
} from "@expo-google-fonts/silkscreen";
import { VT323_400Regular } from "@expo-google-fonts/vt323";

export const FONT_MAP = {
  PixelifySans_400Regular,
  PixelifySans_500Medium,
  PixelifySans_600SemiBold,
  PixelifySans_700Bold,
  Silkscreen_400Regular,
  Silkscreen_700Bold,
  VT323_400Regular,
};

export const FONTS = {
  body: "PixelifySans_400Regular",
  bodyMedium: "PixelifySans_500Medium",
  bodySemibold: "PixelifySans_600SemiBold",
  bodyBold: "PixelifySans_700Bold",
  display: "Silkscreen_400Regular",
  displayBold: "Silkscreen_700Bold",
  mono: "VT323_400Regular",
} as const;
