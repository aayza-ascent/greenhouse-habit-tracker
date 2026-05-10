// Stats tab — big-number cards, 8-week completion heatmap, weekly bar chart,
// achievement badges. Heatmap + chart pull from task_completions in the
// user's timezone.
//
// Ported from greenhouse-prototype-design/project/screens.jsx → StatsScreen.

import * as React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { HUD } from "@/components/ui/HUD";
import { fetchCompletionsByDay } from "@/data/transactions";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

const WEEKS = 8;
const DAY_MS = 86400 * 1000;
const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function StatsScreen() {
  const profile = useGameStore((s) => s.profile);
  const plants = useGameStore((s) => s.plants);
  const inventory = useGameStore((s) => s.inventory);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const tz = profile?.tz ?? "UTC";

  const [byDay, setByDay] = React.useState<Map<string, number>>(new Map());

  React.useEffect(() => {
    if (!profile) return;
    const since = new Date(Date.now() - WEEKS * 7 * DAY_MS).toISOString();
    fetchCompletionsByDay(profile.id, since)
      .then((rows) => {
        const m = new Map<string, number>();
        for (const r of rows) {
          const key = dayKey(new Date(r.completed_at), tz);
          m.set(key, (m.get(key) ?? 0) + 1);
        }
        setByDay(m);
      })
      .catch((e) => console.warn("[stats] fetch failed", e));
  }, [profile?.id, tz]);

  // Heatmap cells: 8 columns (weeks, oldest first) × 7 rows (Mon..Sun).
  const heatColors = [palette.bgPanel2, palette.leafX, palette.leafL, palette.leaf];
  const today = startOfDay(new Date(), tz);
  const heatCells: Array<{ key: string; bucket: number }> = [];
  for (let w = WEEKS - 1; w >= 0; w--) {
    for (let d = 0; d < 7; d++) {
      const date = new Date(today.getTime() - (w * 7 + (6 - d)) * DAY_MS);
      const key = dayKey(date, tz);
      const n = byDay.get(key) ?? 0;
      const bucket = n === 0 ? 0 : n === 1 ? 1 : n === 2 ? 2 : 3;
      heatCells.push({ key, bucket });
    }
  }

  // Weekly bar chart: this week, Mon..Sun.
  const todayWk = startOfWeekISO(today, tz);
  const weekCounts: number[] = [];
  for (let d = 0; d < 7; d++) {
    const date = new Date(todayWk.getTime() + d * DAY_MS);
    weekCounts.push(byDay.get(dayKey(date, tz)) ?? 0);
  }
  const weekMax = Math.max(1, ...weekCounts);

  const badges = [
    { t: "FIRST BLOOM", e: "🌷", got: plants.length >= 1 },
    { t: "7-DAY STREAK", e: "🔥", got: (profile?.streak ?? 0) >= 7 },
    { t: "GREEN THUMB", e: "👍", got: plants.length >= 3 },
    { t: "30-DAY", e: "⭐", got: (profile?.streak ?? 0) >= 30 },
    { t: "COLLECTOR", e: "🏆", got: inventory.length >= 10 },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bgPanel }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
            YOUR GROWTH
          </Text>
          <Text style={[styles.sub, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
            Last {WEEKS} weeks
          </Text>
        </View>
        <HUD
          palette={palette}
          coins={profile?.coins ?? 0}
          xp={profile?.xp ?? 0}
          streak={profile?.streak ?? 0}
        />
      </View>

      <View style={styles.bigNums}>
        {[
          { lbl: "STREAK", val: profile?.streak ?? 0, sub: "days", color: palette.accent },
          { lbl: "PLANTS", val: plants.length, sub: "alive", color: palette.leafL },
          { lbl: "COINS", val: profile?.coins ?? 0, sub: "total", color: palette.coin },
        ].map((s) => (
          <View
            key={s.lbl}
            style={[
              styles.bigCard,
              { backgroundColor: palette.bgPanel2, borderColor: palette.ink },
            ]}
          >
            <Text style={[styles.bigLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
              {s.lbl}
            </Text>
            <Text style={[styles.bigVal, { color: s.color, fontFamily: FONTS.displayBold }]}>
              {s.val}
            </Text>
            <Text style={[styles.bigSub, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
              {s.sub}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
          COMPLETION GRID
        </Text>
        <View style={styles.heatRow}>
          {heatCells.map((c, i) => (
            <View
              key={c.key + ":" + i}
              style={[
                styles.heatCell,
                {
                  backgroundColor: heatColors[c.bucket],
                  borderColor: palette.ink + "33",
                },
              ]}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
          THIS WEEK
        </Text>
        <View
          style={[
            styles.barWrap,
            { backgroundColor: palette.bgPanel2, borderColor: palette.ink },
          ]}
        >
          {weekCounts.map((d, i) => (
            <View key={i} style={styles.barCol}>
              <View
                style={[
                  styles.bar,
                  {
                    height: `${(d / weekMax) * 100}%`,
                    backgroundColor: i === 4 ? palette.accent : palette.leaf,
                    borderColor: palette.ink,
                  },
                ]}
              />
              <Text style={[styles.barLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
                {DAY_LABELS[i]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
          BADGES
        </Text>
        <View style={styles.badgeRow}>
          {badges.map((b) => (
            <View
              key={b.t}
              style={[
                styles.badge,
                {
                  backgroundColor: b.got ? palette.bgPanel2 : palette.bgPanel,
                  borderColor: b.got ? palette.ink : palette.line,
                  opacity: b.got ? 1 : 0.4,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{b.e}</Text>
              <Text style={[styles.badgeText, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
                {b.t}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

function dayKey(d: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(d); // YYYY-MM-DD
}

function startOfDay(d: Date, tz: string): Date {
  const key = dayKey(d, tz);
  return new Date(`${key}T00:00:00Z`);
}

function startOfWeekISO(d: Date, tz: string): Date {
  // ISO: week starts Monday.
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  const offset = map[fmt.format(d)] ?? 0;
  return new Date(d.getTime() - offset * DAY_MS);
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, letterSpacing: 1 },
  sub: { fontSize: 12, marginTop: 2 },
  bigNums: { flexDirection: "row", gap: 8, paddingHorizontal: 14, paddingVertical: 8 },
  bigCard: {
    flex: 1,
    borderWidth: 2,
    padding: 10,
  },
  bigLabel: { fontSize: 10, letterSpacing: 1 },
  bigVal: { fontSize: 22, marginTop: 4 },
  bigSub: { fontSize: 11 },
  section: { paddingHorizontal: 14, paddingVertical: 10 },
  sectionLabel: { fontSize: 12, letterSpacing: 1, marginBottom: 8 },
  heatRow: { flexDirection: "row", flexWrap: "wrap", gap: 3 },
  heatCell: {
    width: `${100 / WEEKS - 1}%`,
    aspectRatio: 1,
    borderWidth: 1,
  },
  barWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 110,
    borderWidth: 2,
    padding: 8,
  },
  barCol: { flex: 1, alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" },
  bar: { width: "100%", borderWidth: 2, minHeight: 2 },
  barLabel: { fontSize: 10 },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    flex: 1,
    alignItems: "center",
    padding: 6,
    borderWidth: 2,
  },
  badgeText: { fontSize: 8, marginTop: 2 },
});
