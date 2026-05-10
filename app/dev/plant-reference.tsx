// Visual diff harness for the flowers-v2 port. Mirrors the layout of
// greenhouse-prototype-design/project/plant-reference.html — 10 species rows
// × 12 stage columns. Open this side-by-side with the original HTML in a
// browser to confirm the port is pixel-accurate.

import { ScrollView, View, Text, StyleSheet } from "react-native";
import { Plant } from "@/components/plants/Plant";
import { FLOWER_ORDER, FLOWERS_V2, STAGES } from "@/components/plants/flowers-v2";
import { FONTS } from "@/theme/fonts";

const SCALE = 3;
const CELL_W = 28 * SCALE + 16;
const CELL_H = 38 * SCALE + 24;
const ROW_LABEL_W = 96;

export default function PlantReference() {
  return (
    <ScrollView
      style={styles.root}
      horizontal={false}
      contentContainerStyle={{ paddingBottom: 60 }}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { fontFamily: FONTS.displayBold }]}>
          🌿 PLANT STAGES · REFERENCE
        </Text>
        <Text style={[styles.sub, { fontFamily: FONTS.body }]}>
          {FLOWER_ORDER.length} species × {STAGES.length} stages · 28×38 sprite ·
          scale ×{SCALE}
        </Text>
      </View>
      <ScrollView horizontal contentContainerStyle={styles.gridScroller}>
        <View>
          {/* Column header */}
          <View style={styles.row}>
            <View style={[styles.rowLabel, styles.cornerCell]}>
              <Text style={[styles.cornerText, { fontFamily: FONTS.displayBold }]}>
                FLOWER ↓ {"\n"}STAGE →
              </Text>
            </View>
            {STAGES.map((s, i) => (
              <View key={s.name} style={[styles.cell, styles.colHeader]}>
                <Text style={[styles.colNum, { fontFamily: FONTS.displayBold }]}>
                  {String(i).padStart(2, "0")}
                </Text>
                <Text style={[styles.colName, { fontFamily: FONTS.display }]}>
                  {s.name.toUpperCase()}
                </Text>
              </View>
            ))}
          </View>
          {/* Body rows */}
          {FLOWER_ORDER.map((flower) => (
            <View key={flower} style={styles.row}>
              <View style={[styles.rowLabel, styles.rowHeader]}>
                <Text style={[styles.rowName, { fontFamily: FONTS.displayBold }]}>
                  {FLOWERS_V2[flower].name.toUpperCase()}
                </Text>
              </View>
              {STAGES.map((_, sIdx) => (
                <View key={sIdx} style={[styles.cell, cellStyleForStage(sIdx)]}>
                  <Plant type={flower} stage={sIdx} scale={SCALE} />
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </ScrollView>
  );
}

function cellStyleForStage(idx: number) {
  if (idx === 11) return styles.cellDead;
  if (idx === 6) return styles.cellThriving;
  if (idx === 7) return styles.cellGlow;
  if (idx === 8 || idx === 9) return styles.cellWilt;
  if (idx === 10) return styles.cellDying;
  return idx % 2 ? styles.cellAlt : styles.cellPlain;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fbf3e6" },
  header: {
    padding: 20,
    borderBottomWidth: 3,
    borderBottomColor: "#2a1a10",
    backgroundColor: "#fff5e2",
  },
  title: { fontSize: 22, color: "#2a1a10", letterSpacing: 1 },
  sub: { fontSize: 13, color: "#7a4a2c", marginTop: 4 },
  gridScroller: { padding: 16 },
  row: { flexDirection: "row" },
  rowLabel: {
    width: ROW_LABEL_W,
    height: CELL_H,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 10,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#2a1a10",
  },
  rowHeader: {
    backgroundColor: "#f3dfb6",
  },
  rowName: { fontSize: 12, color: "#2a1a10" },
  cornerCell: { backgroundColor: "#2a1a10", alignItems: "flex-end", paddingBottom: 6 },
  cornerText: { fontSize: 9, color: "#f6c247", lineHeight: 12, textAlign: "right" },
  cell: {
    width: CELL_W,
    height: CELL_H,
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 6,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#d8b88f",
  },
  colHeader: {
    height: CELL_H,
    backgroundColor: "#f3dfb6",
    justifyContent: "center",
    paddingBottom: 0,
  },
  colNum: { fontSize: 14, color: "#c84a2e" },
  colName: { fontSize: 9, color: "#2a1a10", letterSpacing: 0.5, marginTop: 2 },
  cellPlain: { backgroundColor: "#fff5e2" },
  cellAlt: { backgroundColor: "#f9eed7" },
  cellDead: { backgroundColor: "#3a2c20" },
  cellThriving: { backgroundColor: "#ffe5a0" },
  cellGlow: { backgroundColor: "#ffd56a" },
  cellWilt: { backgroundColor: "#fae6c8" },
  cellDying: { backgroundColor: "#e8d4a8" },
});
