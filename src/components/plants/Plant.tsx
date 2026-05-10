// Plant — the user-facing sprite. Resolves a (type, stage) into a 28×38 grid
// + per-render palette and hands them to PixelSprite. stage is the 12-stage
// index from src/domain/health.ts; same numeric scheme as flowers-v2.STAGES.

import * as React from "react";
import { PixelSprite } from "@/components/ui/PixelSprite";
import { buildFlowerGrid, paletteFor, type FlowerType } from "@/components/plants/flowers-v2";

type Props = {
  type: FlowerType;
  stage: number;
  scale?: number;
  bg?: string;
};

export const Plant = React.memo(function Plant({ type, stage, scale = 4, bg }: Props) {
  const cells = React.useMemo(() => buildFlowerGrid(type, stage), [type, stage]);
  const palette = React.useMemo(() => paletteFor(type, stage), [type, stage]);
  return <PixelSprite cells={cells} palette={palette} scale={scale} bg={bg} />;
});
