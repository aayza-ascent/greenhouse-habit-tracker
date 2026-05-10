import { View, Text, StyleSheet } from "react-native";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export function Placeholder({ title, phase }: { title: string; phase: string }) {
  const p = PIXEL_PALETTES.terracotta;
  return (
    <View style={[styles.root, { backgroundColor: p.bgPanel }]}>
      <Text style={[styles.title, { fontFamily: FONTS.displayBold, color: p.ink }]}>
        {title}
      </Text>
      <Text style={[styles.sub, { fontFamily: FONTS.body, color: p.inkSoft }]}>
        Implemented in {phase}.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 22, marginBottom: 8, letterSpacing: 1 },
  sub: { fontSize: 14 },
});
