// Renders a decor entry's grid through PixelSprite, resolving its palette-key
// map against the active palette. Keeps decor sprites theme-aware in the
// same way plant sprites are.

import * as React from "react";
import { PixelSprite } from "@/components/ui/PixelSprite";
import type { Palette } from "@/theme/palettes";
import type { DecorEntry } from "./catalog";

const gridToCells = (rows: readonly string[]): string[][] =>
  rows.map((r) => Array.from(r));

export function DecorSprite({
  entry,
  palette,
  scale = 3,
}: {
  entry: DecorEntry;
  palette: Palette;
  scale?: number;
}) {
  const resolvedPalette = React.useMemo(() => {
    const out: Record<string, string> = {};
    for (const [char, key] of Object.entries(entry.paletteKeys)) {
      out[char] = palette[key];
    }
    return out;
  }, [entry, palette]);
  return (
    <PixelSprite
      cells={gridToCells(entry.grid)}
      palette={resolvedPalette}
      scale={scale}
    />
  );
}
