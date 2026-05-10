// Generic pixel-grid renderer using react-native-svg. Takes a 2D array of
// 1- or 2-character color codes and a palette map (code → hex) and renders
// each pixel as a <Rect>. Adjacent pixels with the same code in the same
// row are merged into a single rect for a leaner DOM/native tree.
//
// Same algorithm as the prototype's PixelSprite, ported from
// greenhouse-prototype-design/project/flowers-v2.jsx.

import * as React from "react";
import Svg, { Rect } from "react-native-svg";

export type Cells = ReadonlyArray<ReadonlyArray<string>>;

type Props = {
  cells: Cells;
  palette: Record<string, string>;
  scale?: number;
  bg?: string;
};

export const PixelSprite = React.memo(function PixelSprite({
  cells,
  palette,
  scale = 4,
  bg,
}: Props) {
  const h = cells.length;
  const w = h > 0 ? cells[0].length : 0;
  const rects: React.ReactElement[] = [];
  if (bg) {
    rects.push(<Rect key="bg" x={0} y={0} width={w} height={h} fill={bg} />);
  }
  for (let y = 0; y < h; y++) {
    const row = cells[y];
    for (let x = 0; x < w; x++) {
      const c = row[x];
      if (!c || c === "." || c === " ") continue;
      const fill = palette[c];
      if (!fill) continue;
      let run = 1;
      while (x + run < w && row[x + run] === c) run++;
      rects.push(
        <Rect
          key={`${x},${y}`}
          x={x}
          y={y}
          width={run}
          height={1}
          fill={fill}
        />,
      );
      x += run - 1;
    }
  }
  return (
    <Svg width={w * scale} height={h * scale} viewBox={`0 0 ${w} ${h}`}>
      {rects}
    </Svg>
  );
});
