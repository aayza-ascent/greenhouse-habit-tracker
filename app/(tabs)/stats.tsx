// Stats tab — big-number cards, 8-week completion heatmap (rows = days of
// week, columns = weeks oldest → newest), this-week bar chart with today
// highlighted, achievement badges with progress.
//
// All data sources from public.task_completions (filtered to last 8 weeks);
// derived helpers (`dayKey` / `todayDowIdx`) bucket entries in the user's
// timezone.

import * as React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import { HUD } from "@/components/ui/HUD";
import { fetchCompletionsByDay } from "@/data/transactions";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

const WEEKS = 8;
const DAY_MS = 86400 * 1000;
const DAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
// Pixel height of the tallest possible bar — JS-computed, not a percentage,
// so the bar can never overflow its container.
const BAR_MAX_HEIGHT = 100;

export default function StatsScreen() {
  const profile = useGameStore((s) => s.profile);
  const plants = useGameStore((s) => s.plants);
  const inventory = useGameStore((s) => s.inventory);
  const tasks = useGameStore((s) => s.tasks);

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

  // ── Heatmap data ────────────────────────────────────────────────────
  // 7 rows (Mon..Sun) × 8 columns (weeks, oldest → newest, rightmost = this
  // week). Cells past today render transparent.
  const now = new Date();
  const todayKey = dayKey(now, tz);
  const todayDow = todayDowIdx(tz, now); // 0=Mon..6=Sun
  // Anchor: midnight UTC of today. We treat day arithmetic as UTC ms; tz
  // conversion happens via dayKey() at lookup time, so DST doesn't drift the
  // grid since each cell's key is computed against its actual tz.
  const todayUtcAnchor = new Date(now);
  todayUtcAnchor.setUTCHours(12, 0, 0, 0); // noon-ish to dodge any DST jitter

  const heatColors = [palette.bgPanel2, palette.leafX, palette.leafL, palette.leaf];

  // For each (dow, weekOffset) build the cell.
  // weekOffset 0 = this week, 7 = oldest.
  type Cell = { key: string; n: number; isFuture: boolean; isToday: boolean };
  const grid: Cell[][] = []; // [dow][week] indexed; week 0 is leftmost (oldest)
  for (let dow = 0; dow < 7; dow++) {
    const row: Cell[] = [];
    for (let weekIdxLeftToRight = 0; weekIdxLeftToRight < WEEKS; weekIdxLeftToRight++) {
      // weekOffset: 0 = current week, increases going back in time.
      const weekOffset = WEEKS - 1 - weekIdxLeftToRight;
      // Days from today: walk back to this-week's `dow`, then back N more weeks.
      const daysBack = (todayDow - dow + 7) % 7 + weekOffset * 7;
      const cellDate = new Date(todayUtcAnchor.getTime() - daysBack * DAY_MS);
      // Future cells happen when `dow > todayDow` in week 0.
      const isFuture = weekOffset === 0 && dow > todayDow;
      const key = dayKey(cellDate, tz);
      const n = isFuture ? 0 : byDay.get(key) ?? 0;
      row.push({ key, n, isFuture, isToday: !isFuture && key === todayKey });
    }
    grid.push(row);
  }

  // ── Bar chart data (this week) ─────────────────────────────────────
  const weekCounts: number[] = [];
  for (let dow = 0; dow < 7; dow++) {
    const daysBack = (todayDow - dow + 7) % 7;
    const cellDate = new Date(todayUtcAnchor.getTime() - daysBack * DAY_MS);
    const isFuture = dow > todayDow;
    weekCounts.push(isFuture ? 0 : byDay.get(dayKey(cellDate, tz)) ?? 0);
  }
  const weekMax = Math.max(1, ...weekCounts);
  const weekTotal = weekCounts.reduce((a, b) => a + b, 0);

  // ── Aggregate stats ────────────────────────────────────────────────
  const totalDone = Array.from(byDay.values()).reduce((a, b) => a + b, 0);
  const activeTasks = tasks.length;

  // ── Badges with progress ───────────────────────────────────────────
  const badges = [
    { t: "FIRST BLOOM", e: "🌷", got: plants.length >= 1, progress: `${Math.min(plants.length, 1)}/1` },
    {
      t: "7-DAY STREAK",
      e: "🔥",
      got: (profile?.streak ?? 0) >= 7,
      progress: `${Math.min(profile?.streak ?? 0, 7)}/7`,
    },
    {
      t: "GREEN THUMB",
      e: "👍",
      got: plants.length >= 3,
      progress: `${Math.min(plants.length, 3)}/3`,
    },
    {
      t: "30-DAY",
      e: "⭐",
      got: (profile?.streak ?? 0) >= 30,
      progress: `${Math.min(profile?.streak ?? 0, 30)}/30`,
    },
    {
      t: "COLLECTOR",
      e: "🏆",
      got: inventory.length >= 10,
      progress: `${inventory.length}/10`,
    },
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
          { lbl: "DONE", val: totalDone, sub: "total tasks", color: palette.leafL },
          {
            lbl: "PLANTS",
            val: plants.length,
            sub: `of ${activeTasks || 1} tasks`,
            color: palette.coin,
          },
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
          DAILY COMPLETIONS · LAST 8 WEEKS
        </Text>
        <Text style={[styles.sectionSub, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
          Each square is one day. Greener = more tasks done.
        </Text>
        {grid.map((row, dayIdx) => (
          <View key={dayIdx} style={styles.heatRow}>
            <Text
              style={[
                styles.heatDayLabel,
                { color: palette.inkSoft, fontFamily: FONTS.displayBold },
              ]}
            >
              {DAY_LABELS[dayIdx]}
            </Text>
            {row.map((cell, weekIdx) => {
              const bucket = cell.n === 0 ? 0 : cell.n === 1 ? 1 : cell.n === 2 ? 2 : 3;
              return (
                <View
                  key={weekIdx}
                  style={[
                    styles.heatCell,
                    {
                      backgroundColor: cell.isFuture ? "transparent" : heatColors[bucket],
                      borderColor: cell.isToday ? palette.accent : palette.ink + "22",
                      borderWidth: cell.isToday ? 2 : 1,
                    },
                  ]}
                />
              );
            })}
          </View>
        ))}
        <View style={styles.legendBar}>
          {[
            { lbl: "0", c: heatColors[0] },
            { lbl: "1", c: heatColors[1] },
            { lbl: "2", c: heatColors[2] },
            { lbl: "3+", c: heatColors[3] },
          ].map((item) => (
            <View key={item.lbl} style={styles.legendItem}>
              <View
                style={[
                  styles.legendCell,
                  { backgroundColor: item.c, borderColor: palette.ink + "33" },
                ]}
              />
              <Text
                style={[
                  styles.legendText,
                  { color: palette.inkSoft, fontFamily: FONTS.body },
                ]}
              >
                {item.lbl}
              </Text>
            </View>
          ))}
          <View style={{ flex: 1 }} />
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendCell,
                {
                  backgroundColor: palette.bgPanel,
                  borderColor: palette.accent,
                  borderWidth: 2,
                },
              ]}
            />
            <Text
              style={[
                styles.legendText,
                { color: palette.inkSoft, fontFamily: FONTS.body },
              ]}
            >
              today
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
            THIS WEEK
          </Text>
          <Text style={[styles.weekTotal, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
            {weekTotal} done
          </Text>
        </View>
        <View
          style={[
            styles.barWrap,
            { backgroundColor: palette.bgPanel2, borderColor: palette.ink },
          ]}
        >
          <View style={styles.barChartArea}>
            {weekCounts.map((d, i) => {
              const isToday = i === todayDow;
              const isFuture = i > todayDow;
              const barHeight = Math.round((d / weekMax) * BAR_MAX_HEIGHT);
              return (
                <View key={i} style={styles.barCol}>
                  {!isFuture && d > 0 && (
                    <Text
                      style={[
                        styles.barCount,
                        { color: palette.inkSoft, fontFamily: FONTS.displayBold },
                      ]}
                    >
                      {d}
                    </Text>
                  )}
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isFuture
                          ? "transparent"
                          : isToday
                            ? palette.accent
                            : palette.leaf,
                        borderColor: isFuture ? palette.line + "44" : palette.ink,
                        borderStyle: isFuture ? "dashed" : "solid",
                        opacity: isFuture ? 0.4 : 1,
                      },
                    ]}
                  />
                </View>
              );
            })}
          </View>
          <View style={styles.barLabelRow}>
            {weekCounts.map((_, i) => {
              const isToday = i === todayDow;
              return (
                <Text
                  key={i}
                  style={[
                    styles.barLabel,
                    {
                      color: isToday ? palette.accent : palette.inkSoft,
                      fontFamily: FONTS.displayBold,
                    },
                  ]}
                >
                  {DAY_LABELS[i].slice(0, 1)}
                </Text>
              );
            })}
          </View>
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
                  opacity: b.got ? 1 : 0.5,
                },
              ]}
            >
              <Text style={{ fontSize: 22 }}>{b.e}</Text>
              <Text style={[styles.badgeText, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
                {b.t}
              </Text>
              <Text
                style={[
                  styles.badgeProgress,
                  {
                    color: b.got ? palette.leafD : palette.inkSoft,
                    fontFamily: FONTS.body,
                  },
                ]}
              >
                {b.progress}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

// ── tz-aware day helpers ────────────────────────────────────────────────
function dayKey(d: Date, tz: string): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function todayDowIdx(tz: string, now: Date): number {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" });
  const map: Record<string, number> = {
    Mon: 0,
    Tue: 1,
    Wed: 2,
    Thu: 3,
    Fri: 4,
    Sat: 5,
    Sun: 6,
  };
  return map[fmt.format(now)] ?? 0;
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
  bigCard: { flex: 1, borderWidth: 2, padding: 10 },
  bigLabel: { fontSize: 10, letterSpacing: 1 },
  bigVal: { fontSize: 22, marginTop: 4 },
  bigSub: { fontSize: 10, marginTop: 2 },
  section: { paddingHorizontal: 14, paddingVertical: 10 },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sectionLabel: { fontSize: 12, letterSpacing: 1, marginBottom: 4 },
  sectionSub: { fontSize: 11, marginBottom: 8 },
  legendBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  legendText: { fontSize: 10 },
  legendCell: { width: 12, height: 12, borderWidth: 1 },
  heatRow: { flexDirection: "row", alignItems: "center", gap: 3, marginBottom: 3 },
  heatDayLabel: { width: 28, fontSize: 9, letterSpacing: 0.5 },
  heatCell: { flex: 1, aspectRatio: 1 },
  weekTotal: { fontSize: 12, letterSpacing: 0.5 },
  // Bar chart: a fixed-height chart area + a separate label row beneath.
  // No more nested percentage heights — `BAR_MAX_HEIGHT` (JS) drives bar size.
  barWrap: { borderWidth: 2, padding: 10 },
  barChartArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    height: 120, // BAR_MAX_HEIGHT (100) + ~14 for the optional count label
  },
  barCol: { flex: 1, alignItems: "center", justifyContent: "flex-end" },
  bar: { width: "100%", borderWidth: 2, minHeight: 2 },
  barCount: { fontSize: 9, marginBottom: 2 },
  barLabelRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  barLabel: { flex: 1, fontSize: 11, textAlign: "center" },
  badgeRow: { flexDirection: "row", gap: 8 },
  badge: {
    flex: 1,
    alignItems: "center",
    padding: 6,
    borderWidth: 2,
  },
  badgeText: { fontSize: 8, marginTop: 2, textAlign: "center" },
  badgeProgress: { fontSize: 9, marginTop: 2 },
});
