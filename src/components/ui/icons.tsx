// HUD icons ported from greenhouse-prototype-design/project/pixel-art.jsx.
// Each icon resolves single-character codes against the active palette so
// CoinIcon picks up gold from terracotta, mauve gold from twilight, etc.

import * as React from "react";
import { PixelSprite } from "./PixelSprite";
import type { Palette } from "@/theme/palettes";

const gridToCells = (rows: readonly string[]): string[][] =>
  rows.map((r) => Array.from(r));

const COIN_GRID = [
  "..yyyy..",
  ".yYYYYy.",
  "yYYffYYy",
  "yYYffYYy",
  "yYYffYYy",
  "yYYYYYYy",
  ".yYYYYy.",
  "..yyyy..",
];

export function CoinIcon({ palette, scale = 3 }: { palette: Palette; scale?: number }) {
  return (
    <PixelSprite
      cells={gridToCells(COIN_GRID)}
      scale={scale}
      palette={{ y: palette.coinDark, Y: palette.coin, f: "#fff7c8" }}
    />
  );
}

const XP_GRID = [
  "....x....",
  "...xXx...",
  "..xXXXx..",
  "xXXXXXXXx",
  ".xXXXXXx.",
  "..xX.Xx..",
  ".xX...Xx.",
  "xX.....Xx",
];

export function XPIcon({ palette, scale = 3 }: { palette: Palette; scale?: number }) {
  return (
    <PixelSprite
      cells={gridToCells(XP_GRID)}
      scale={scale}
      palette={{ x: palette.coinDark, X: palette.accentB }}
    />
  );
}

const HEART_GRID = [
  ".rr..rr.",
  "rRRrrRRr",
  "rRRRRRRr",
  "rRRRRRRr",
  ".rRRRRr.",
  "..rRRr..",
  "...rr...",
];

export function HeartIcon({
  palette,
  scale = 3,
  color,
}: {
  palette: Palette;
  scale?: number;
  color?: string;
}) {
  return (
    <PixelSprite
      cells={gridToCells(HEART_GRID)}
      scale={scale}
      palette={{ r: "#7a1a2a", R: color ?? palette.accent }}
    />
  );
}

const SUN_GRID = [
  "....y....",
  "..y.y.y..",
  "...yyy...",
  ".yyyYYyyy.",
  "y.yYYYYy.y",
  "y.yYYYYy.y",
  ".yyyYYyyy.",
  "...yyy...",
  "..y.y.y..",
  "....y....",
];

export function SunIcon({ palette, scale = 3 }: { palette: Palette; scale?: number }) {
  return (
    <PixelSprite
      cells={gridToCells(SUN_GRID)}
      scale={scale}
      palette={{ y: palette.sun, Y: "#fff7c8" }}
    />
  );
}

const MOON_GRID = [
  "...mmmm..",
  "..mMMMmm.",
  ".mMMMMMmm",
  "mMMMMMmmm",
  "mMMMMMmm.",
  "mMMMMMmm.",
  ".mMMMMmm.",
  "..mMMmm..",
  "...mmm...",
];

export function MoonIcon({ palette, scale = 3 }: { palette: Palette; scale?: number }) {
  return (
    <PixelSprite
      cells={gridToCells(MOON_GRID)}
      scale={scale}
      palette={{ m: palette.inkSoft, M: palette.moon }}
    />
  );
}

const STAR_GRID = [
  "....s....",
  "...sSs...",
  "...sSs...",
  "sssSSSsss",
  ".sSSSSSs.",
  "..sSSSs..",
  ".sS.S.Ss.",
  "s.s...s.s",
];

export function StarIcon({
  palette,
  scale = 2,
  color,
}: {
  palette: Palette;
  scale?: number;
  color?: string;
}) {
  return (
    <PixelSprite
      cells={gridToCells(STAR_GRID)}
      scale={scale}
      palette={{ s: palette.coinDark, S: color ?? palette.star }}
    />
  );
}

const TAB_ICONS: Record<string, string[]> = {
  greenhouse: [
    "...gggg...",
    "..gGGGGg..",
    ".gGGGGGGg.",
    "gGgGGGgGg.",
    "wwwwwwwww.",
    "wbwbwbwbw.",
    "wbwbwbwbw.",
    "wwwwwwwww.",
    "..........",
    "..........",
  ],
  tasks: [
    "bbbbbbbbb.",
    "b.......b.",
    "b.cc....b.",
    "b.cc.LL.b.",
    "b....LL.b.",
    "b.cc....b.",
    "b.cc.LL.b.",
    "b....LL.b.",
    "b.......b.",
    "bbbbbbbbb.",
  ],
  shop: [
    "..bbbbb...",
    ".b.....b..",
    ".b.....b..",
    "bbbbbbbbb.",
    "b.......b.",
    "b.cc.cc.b.",
    "b.......b.",
    "b.cc.cc.b.",
    "b.......b.",
    "bbbbbbbbb.",
  ],
  stats: [
    "..........",
    ".........b",
    "......c..b",
    "......c..b",
    "...c..c..b",
    "...c..c..b",
    ".c.c..c..b",
    ".c.c..c..b",
    ".c.c..c..b",
    "bbbbbbbbbb",
  ],
  profile: [
    "...ccc....",
    "..cCCCc...",
    "..cCCCc...",
    "...ccc....",
    "..cccccc..",
    ".cCCCCCCc.",
    ".cCCCCCCc.",
    "cCCCCCCCCc",
    "cCCCCCCCCc",
    "cccccccccc",
  ],
};

export type TabIconName = keyof typeof TAB_ICONS;

export function TabIcon({
  name,
  active,
  palette,
  scale = 3,
}: {
  name: TabIconName;
  active: boolean;
  palette: Palette;
  scale?: number;
}) {
  const base = active ? palette.accent : palette.inkSoft;
  const hi = active ? palette.accentB : palette.line;
  return (
    <PixelSprite
      cells={gridToCells(TAB_ICONS[name])}
      scale={scale}
      palette={{ b: base, B: base, c: base, C: hi, g: base, G: hi, w: base, L: hi }}
    />
  );
}
