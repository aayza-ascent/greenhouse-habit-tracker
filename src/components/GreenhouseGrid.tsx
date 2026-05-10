// Drag-and-drop greenhouse grid. Each plant sits in a slot; long-pressing
// + dragging moves it to another slot (swapping with whatever's there).
// A short tap surfaces the plant info modal.
//
// Uses react-native-gesture-handler's Gesture API with .runOnJS(true) so
// callbacks can use plain React state. Performance is fine for the small
// number of plants involved (≤48 in the 8x6 max grid).

import * as React from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

import { Plant } from "@/components/plants/Plant";
import type { Plant as PlantRow } from "@/data/types";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";
import { Pressable, Text } from "react-native";

const SLOT_W = 50;
const SLOT_H = 64;

type Props = {
  palette: Palette;
  plants: PlantRow[];
  cols: number;
  rows: number;
  onTapPlant: (plant: PlantRow) => void;
  onMovePlant: (plantId: string, col: number, row: number) => void;
  onTapEmpty?: () => void;
};

export function GreenhouseGrid({
  palette,
  plants,
  cols,
  rows,
  onTapPlant,
  onMovePlant,
  onTapEmpty,
}: Props) {
  const [dragId, setDragId] = React.useState<string | null>(null);
  const [dragOffset, setDragOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoverSlot, setHoverSlot] = React.useState<{ col: number; row: number } | null>(null);

  const occupied = React.useMemo(
    () => new Set(plants.map((p) => `${p.slotCol},${p.slotRow}`)),
    [plants],
  );

  const containerW = cols * SLOT_W;
  const containerH = rows * SLOT_H;

  return (
    <View style={[styles.container, { width: containerW, height: containerH }]}>
      {/* Slot tiles — borders + hover highlight */}
      {Array.from({ length: rows * cols }).map((_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const isHover = dragId && hoverSlot?.col === col && hoverSlot?.row === row;
        const empty = !occupied.has(`${col},${row}`);
        return (
          <Pressable
            key={i}
            onPress={empty && onTapEmpty ? onTapEmpty : undefined}
            style={[
              styles.slot,
              {
                left: col * SLOT_W,
                top: row * SLOT_H,
                width: SLOT_W - 2,
                height: SLOT_H - 2,
                borderColor: empty ? palette.line + "80" : "transparent",
                backgroundColor: isHover
                  ? palette.coin + "55"
                  : empty
                    ? palette.bgPanel + "33"
                    : "transparent",
              },
            ]}
          >
            {empty && (
              <Text
                style={{
                  fontSize: 18,
                  color: palette.line,
                  opacity: 0.5,
                  fontFamily: FONTS.displayBold,
                }}
              >
                +
              </Text>
            )}
          </Pressable>
        );
      })}

      {/* Plants — bottom-anchored to slot, with a tap+drag gesture each */}
      {plants.map((p) => (
        <DraggablePlant
          key={p.id}
          plant={p}
          palette={palette}
          dragging={dragId === p.id}
          dragOffset={dragId === p.id ? dragOffset : { x: 0, y: 0 }}
          renderSlot={
            dragId === p.id && hoverSlot
              ? hoverSlot
              : { col: p.slotCol, row: p.slotRow }
          }
          onStart={() => {
            setDragId(p.id);
            setHoverSlot({ col: p.slotCol, row: p.slotRow });
            setDragOffset({ x: 0, y: 0 });
          }}
          onUpdate={(dx, dy) => {
            setDragOffset({ x: dx, y: dy });
            // Compute hover slot based on plant's start position + delta.
            const baseX = p.slotCol * SLOT_W + SLOT_W / 2;
            const baseY = p.slotRow * SLOT_H + SLOT_H;
            const targetCol = clamp(
              Math.floor((baseX + dx) / SLOT_W),
              0,
              cols - 1,
            );
            const targetRow = clamp(
              Math.floor((baseY + dy) / SLOT_H),
              0,
              rows - 1,
            );
            setHoverSlot({ col: targetCol, row: targetRow });
          }}
          onEnd={(dx, dy) => {
            setDragId(null);
            const moved = Math.abs(dx) > 6 || Math.abs(dy) > 6;
            if (!moved) {
              onTapPlant(p);
              setHoverSlot(null);
              return;
            }
            const target = hoverSlot;
            setHoverSlot(null);
            if (
              target &&
              (target.col !== p.slotCol || target.row !== p.slotRow)
            ) {
              onMovePlant(p.id, target.col, target.row);
            }
          }}
        />
      ))}
    </View>
  );
}

function DraggablePlant({
  plant,
  palette,
  dragging,
  dragOffset,
  renderSlot,
  onStart,
  onUpdate,
  onEnd,
}: {
  plant: PlantRow;
  palette: Palette;
  dragging: boolean;
  dragOffset: { x: number; y: number };
  renderSlot: { col: number; row: number };
  onStart: () => void;
  onUpdate: (dx: number, dy: number) => void;
  onEnd: (dx: number, dy: number) => void;
}) {
  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .minDistance(0)
        .onStart(() => onStart())
        .onUpdate((e) => onUpdate(e.translationX, e.translationY))
        .onEnd((e) => onEnd(e.translationX, e.translationY))
        .onFinalize((e) => {
          // Tap (no drag) → ensure onEnd still fires.
          if (Math.abs(e.translationX) < 1 && Math.abs(e.translationY) < 1) {
            onEnd(e.translationX, e.translationY);
          }
        }),
    [onStart, onUpdate, onEnd],
  );

  // When dragging, use the live drag offset for visuals. When not dragging,
  // anchor to the current slot.
  const left =
    renderSlot.col * SLOT_W + SLOT_W / 2 + (dragging ? dragOffset.x : 0);
  const top =
    renderSlot.row * SLOT_H + SLOT_H + (dragging ? dragOffset.y : 0);

  const healthColor =
    plant.health > 70 ? palette.leafL : plant.health > 49 ? palette.coin : palette.accent;

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={[
          styles.plantWrap,
          {
            left,
            top,
            transform: [
              { translateX: -SLOT_W / 2 },
              { translateY: -SLOT_H },
              { scale: dragging ? 1.15 : 1 },
            ],
            zIndex: dragging ? 10 : 1,
          },
        ]}
      >
        <View
          style={[
            styles.healthPip,
            { backgroundColor: palette.ink + "44" },
          ]}
        >
          <View
            style={{
              width: `${plant.health}%`,
              height: "100%",
              backgroundColor: healthColor,
            }}
          />
        </View>
        <Plant type={plant.type} stage={plant.stageIdx} scale={3} />
      </View>
    </GestureDetector>
  );
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

const styles = StyleSheet.create({
  container: { position: "relative" },
  slot: {
    position: "absolute",
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  plantWrap: {
    position: "absolute",
    width: SLOT_W,
    height: SLOT_H,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  healthPip: {
    position: "absolute",
    top: -4,
    width: 24,
    height: 4,
    overflow: "hidden",
  },
});
