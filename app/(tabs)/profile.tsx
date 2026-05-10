// Profile tab — palette / time-of-day / grid size pickers, sign-out, account
// email. Notification toggles ship as cosmetic on/off in v1; actual scheduling
// happens per-task in new-task.tsx.
//
// Ported from greenhouse-prototype-design/project/screens.jsx → ProfileScreen.

import * as React from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { Plant } from "@/components/plants/Plant";
import { FLOWERS_V2 } from "@/components/plants/flowers-v2";
import { PixelButton } from "@/components/ui/PixelButton";
import { devSkipADay } from "@/data/cron";
import { supabase } from "@/data/supabase";
import { STAGE_NAMES } from "@/domain/health";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES, type PaletteKey } from "@/theme/palettes";
import type { TimeOfDay } from "@/data/types";

const DEV_COIN_GRANT = 100;
const DEV_XP_GRANT = 100;

const PALETTES: PaletteKey[] = ["terracotta", "twilight", "pastel"];
const TIMES: TimeOfDay[] = ["day", "dusk", "night"];
const GRID_OPTS = [
  { cols: 4, rows: 3, label: "4×3" },
  { cols: 6, rows: 4, label: "6×4" },
  { cols: 6, rows: 6, label: "6×6" },
  { cols: 8, rows: 5, label: "8×5" },
];

export default function ProfileScreen() {
  const profile = useGameStore((s) => s.profile);
  const plants = useGameStore((s) => s.plants);
  const tasks = useGameStore((s) => s.tasks);
  const updateProfilePatch = useGameStore((s) => s.updateProfilePatch);
  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];

  const [email, setEmail] = React.useState<string | null>(null);
  React.useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null));
  }, []);

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: palette.bgPanel }]}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <View style={[styles.hero, { backgroundColor: palette.bgPanel2, borderBottomColor: palette.ink }]}>
        <Text style={[styles.heroName, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
          {profile?.username ?? "PIXEL GARDENER"}
        </Text>
        <Text style={[styles.heroMeta, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
          Lvl {profile?.level ?? 1} · {profile?.xp ?? 0} XP
        </Text>
        <View
          style={[
            styles.xpBar,
            { backgroundColor: palette.bgPanel, borderColor: palette.ink },
          ]}
        >
          <View
            style={{
              height: "100%",
              width: `${(profile?.xp ?? 0) % 100}%`,
              backgroundColor: palette.accentB,
            }}
          />
        </View>
      </View>

      <Section title="THEME" palette={palette}>
        <Row palette={palette} label="Palette" sub={PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"].name}>
          <View style={styles.chipRow}>
            {PALETTES.map((k) => (
              <Pressable
                key={k}
                onPress={() => updateProfilePatch({ paletteKey: k })}
                style={[
                  styles.chip,
                  {
                    borderColor: palette.ink,
                    backgroundColor:
                      profile?.paletteKey === k ? palette.accent : palette.bgPanel,
                  },
                ]}
              >
                <Text
                  style={{
                    color: profile?.paletteKey === k ? "#fff" : palette.ink,
                    fontFamily: FONTS.displayBold,
                    fontSize: 10,
                  }}
                >
                  {k.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </Row>
        <Row palette={palette} label="Time of day" sub={profile?.timeOfDay ?? "day"}>
          <View style={styles.chipRow}>
            {TIMES.map((t) => (
              <Pressable
                key={t}
                onPress={() => updateProfilePatch({ timeOfDay: t })}
                style={[
                  styles.chip,
                  {
                    borderColor: palette.ink,
                    backgroundColor:
                      profile?.timeOfDay === t ? palette.accent : palette.bgPanel,
                  },
                ]}
              >
                <Text
                  style={{
                    color: profile?.timeOfDay === t ? "#fff" : palette.ink,
                    fontFamily: FONTS.displayBold,
                    fontSize: 10,
                  }}
                >
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>
        </Row>
      </Section>

      <Section title="GREENHOUSE" palette={palette}>
        <Row
          palette={palette}
          label="Grid"
          sub={`${profile?.gridCols ?? 6} × ${profile?.gridRows ?? 6}`}
        >
          <View style={styles.chipRow}>
            {GRID_OPTS.map((g) => {
              const on =
                profile?.gridCols === g.cols && profile?.gridRows === g.rows;
              return (
                <Pressable
                  key={g.label}
                  onPress={() =>
                    updateProfilePatch({ gridCols: g.cols, gridRows: g.rows })
                  }
                  style={[
                    styles.chip,
                    {
                      borderColor: palette.ink,
                      backgroundColor: on ? palette.accent : palette.bgPanel,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: on ? "#fff" : palette.ink,
                      fontFamily: FONTS.displayBold,
                      fontSize: 10,
                    }}
                  >
                    {g.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Row>
      </Section>

      <Section title="ACCOUNT" palette={palette}>
        <Row palette={palette} label="Signed in as" sub={email ?? "—"} />
        <Row palette={palette} label="Timezone" sub={profile?.tz ?? "UTC"} />
      </Section>

      {__DEV__ && profile && (
        <Section title="DEV" palette={palette}>
          <View style={styles.devGrants}>
            <PixelButton
              palette={palette}
              color={palette.coin}
              fg={palette.ink}
              size="sm"
              style={{ flex: 1 }}
              onPress={() =>
                updateProfilePatch({ coins: profile.coins + DEV_COIN_GRANT })
              }
            >
              {`+ ${DEV_COIN_GRANT} 🪙`}
            </PixelButton>
            <PixelButton
              palette={palette}
              color={palette.accentB}
              fg={palette.ink}
              size="sm"
              style={{ flex: 1 }}
              onPress={() =>
                updateProfilePatch({ xp: profile.xp + DEV_XP_GRANT })
              }
            >
              {`+ ${DEV_XP_GRANT} XP`}
            </PixelButton>
          </View>
          <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
            <PixelButton
              palette={palette}
              color={palette.line}
              size="sm"
              onPress={() => devSkipADay(profile.id)}
            >
              SKIP A DAY (DECAY NOW)
            </PixelButton>
          </View>

          {/* Plant progress inspector — every plant in the greenhouse, sorted
              by stage so newly-sprouted ones surface first. Useful for
              eyeballing whether the stage banding fires correctly without
              having to drag-tap each tile in the greenhouse view. */}
          {plants.length > 0 && (
            <View style={{ paddingHorizontal: 12, paddingVertical: 6 }}>
              <Text
                style={[
                  styles.devPlantsHeader,
                  { color: palette.inkSoft, fontFamily: FONTS.displayBold },
                ]}
              >
                PLANT PROGRESS · {plants.length}
              </Text>
              {plants
                .slice()
                .sort((a, b) => a.stageIdx - b.stageIdx)
                .map((p) => {
                  const linkedTask = tasks.find((t) => t.id === p.taskId);
                  return (
                    <View
                      key={p.id}
                      style={[
                        styles.devPlantRow,
                        { backgroundColor: palette.bgPanel, borderColor: palette.line },
                      ]}
                    >
                      <Plant type={p.type} stage={p.stageIdx} scale={1.5} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text
                          style={[
                            styles.devPlantName,
                            { color: palette.ink, fontFamily: FONTS.bodySemibold },
                          ]}
                        >
                          {FLOWERS_V2[p.type].name}{" "}
                          <Text style={{ color: palette.inkSoft, fontFamily: FONTS.body }}>
                            · {STAGE_NAMES[p.stageIdx] ?? "?"}
                          </Text>
                        </Text>
                        <Text
                          style={[
                            styles.devPlantMeta,
                            { color: palette.inkSoft, fontFamily: FONTS.body },
                          ]}
                        >
                          health {p.health} · stage {p.stageIdx} · ticks@full {p.ticksAtFull}
                        </Text>
                        <Text
                          style={[
                            styles.devPlantMeta,
                            { color: palette.inkSoft, fontFamily: FONTS.body },
                          ]}
                        >
                          {linkedTask
                            ? `🔥 ${linkedTask.streak}d · ${linkedTask.icon} ${linkedTask.name}`
                            : "no linked task"}
                        </Text>
                      </View>
                    </View>
                  );
                })}
            </View>
          )}
        </Section>
      )}

      <View style={{ padding: 18 }}>
        <PixelButton
          palette={palette}
          color={palette.line}
          onPress={() => supabase.auth.signOut()}
        >
          SIGN OUT
        </PixelButton>
      </View>
    </ScrollView>
  );
}

function Section({
  title,
  palette,
  children,
}: {
  title: string;
  palette: ReturnType<typeof getPalette>;
  children: React.ReactNode;
}) {
  return (
    <View>
      <Text
        style={[
          styles.sectionLabel,
          { color: palette.inkSoft, fontFamily: FONTS.displayBold },
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionBody,
          { backgroundColor: palette.bgPanel2, borderColor: palette.ink },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

function Row({
  palette,
  label,
  sub,
  children,
}: {
  palette: ReturnType<typeof getPalette>;
  label: string;
  sub?: string;
  children?: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.row,
        { borderBottomColor: palette.line + "55" },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.bodySemibold, fontSize: 15 }}>
          {label}
        </Text>
        {sub && (
          <Text
            style={{
              color: palette.inkSoft,
              fontFamily: FONTS.body,
              fontSize: 12,
              marginTop: 2,
            }}
          >
            {sub}
          </Text>
        )}
      </View>
      {children}
    </View>
  );
}

function getPalette() {
  return PIXEL_PALETTES.terracotta;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 14,
    paddingVertical: 18,
    borderBottomWidth: 2,
  },
  heroName: { fontSize: 16, letterSpacing: 1 },
  heroMeta: { fontSize: 12, marginTop: 4 },
  xpBar: { marginTop: 8, height: 8, borderWidth: 2 },
  sectionLabel: {
    fontSize: 11,
    letterSpacing: 1,
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 6,
  },
  sectionBody: {
    borderTopWidth: 2,
    borderBottomWidth: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    gap: 12,
    flexWrap: "wrap",
  },
  chipRow: { flexDirection: "row", gap: 6 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
  },
  devGrants: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
  },
  devPlantsHeader: { fontSize: 10, letterSpacing: 1, marginTop: 8, marginBottom: 6 },
  devPlantRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    marginBottom: 6,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  devPlantName: { fontSize: 13 },
  devPlantMeta: { fontSize: 11, marginTop: 2 },
});
