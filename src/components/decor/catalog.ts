// Decor catalog — XP-priced cosmetics. Sprites + palette mappings ported
// from greenhouse-prototype-design/project/screens.jsx (the prototype's
// shop/decor tab). Each entry knows which palette keys to bind to its grid
// chars at render time so the decor adapts to the active theme.

import type { Palette } from "@/theme/palettes";

export type DecorId =
  | "terra-pot"
  | "stone-path"
  | "trellis"
  | "fairy-light"
  | "moss-stone"
  | "wind-chime";

export type DecorEntry = {
  id: DecorId;
  name: string;
  xp: number;
  desc: string;
  grid: string[];
  // Map of grid char → palette key. Resolves to a hex via PIXEL_PALETTES at
  // render time. Lets one sprite work across all three palettes.
  paletteKeys: Record<string, keyof Palette>;
};

export const DECOR_CATALOG: DecorEntry[] = [
  {
    id: "stone-path",
    name: "Stone Path",
    xp: 80,
    desc: "Lay a route between pots.",
    grid: [
      "kkkkkkkkkk",
      "kssksksskk",
      "kskskskssk",
      "ksskskskks",
      "kkkkkkkkkk",
    ],
    paletteKeys: { k: "line", s: "bgFloor" },
  },
  {
    id: "terra-pot",
    name: "Terra Pot",
    xp: 120,
    desc: "An empty companion pot.",
    grid: [
      "..pppppppp..",
      ".pPPPPPPPPp.",
      "pPPPPPPPPPPp",
      "pkkkkkkkkkkp",
      ".pkkkkkkkkp.",
      "..pkkkkkkp..",
    ],
    paletteKeys: { p: "pot", P: "potL", k: "potD" },
  },
  {
    id: "moss-stone",
    name: "Moss Stone",
    xp: 160,
    desc: "Soft. Quiet. Permanent.",
    grid: [
      "..llll..",
      ".lllllll.",
      "llkkkkkll",
      "lkkkkkkkl",
      "lkkkkkkkl",
      ".kkkkkkk.",
      "..kkkkk..",
    ],
    paletteKeys: { l: "leaf", k: "soilL" },
  },
  {
    id: "trellis",
    name: "Trellis",
    xp: 220,
    desc: "Climbing-vine accessory.",
    grid: [
      "b........b",
      "b.l...l..b",
      "b..l.l...b",
      "b...l....b",
      "b..l.l...b",
      "b.l...l..b",
      "bbbbbbbbbb",
    ],
    paletteKeys: { b: "line", l: "leaf" },
  },
  {
    id: "wind-chime",
    name: "Wind Chime",
    xp: 280,
    desc: "Catches the breeze.",
    grid: [
      "...bbb....",
      "...b.b....",
      "..bcccb...",
      "...c.c....",
      "...c.c....",
      "...c.c....",
      "...y.y....",
    ],
    paletteKeys: { b: "ink", c: "coin", y: "coinDark" },
  },
  {
    id: "fairy-light",
    name: "Fairy Lights",
    xp: 360,
    desc: "Glow at dusk.",
    grid: [
      "..........",
      ".bbbbbbbbb",
      "y.b.y.b.y.",
      ".b.y.b.y.b",
      "y.........",
    ],
    paletteKeys: { b: "line", y: "coin" },
  },
];

export function getDecor(id: string): DecorEntry | undefined {
  return DECOR_CATALOG.find((d) => d.id === id);
}

// Number of slots in the greenhouse decor "shelf" strip. Bumping this only
// requires updating the CHECK constraint in the migration if you go above 8.
export const DECOR_STRIP_SLOTS = 6;
