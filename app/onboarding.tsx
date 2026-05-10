// Three-step onboarding: welcome → pick first seed → name first task. On
// finish: gifts the three starter species in inventory_owned, plants the
// chosen seed in slot (0,0), creates a daily task linked to it, sets
// profiles.onboarded = true, and navigates to /(tabs)/greenhouse.

import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { GreenhouseSky } from "@/components/GreenhouseSky";
import { Plant } from "@/components/plants/Plant";
import { FLOWERS_V2, type FlowerType } from "@/components/plants/flowers-v2";
import { PLANT_CATALOG, STARTER_TYPES } from "@/components/plants/catalog";
import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { unlockPlant } from "@/data/inventory";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

const TASK_ICONS = ["💧", "📚", "🏃", "🧘", "✍️", "🥗"];

export default function Onboarding() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const setInventory = useGameStore((s) => s.setInventory);
  const addTask = useGameStore((s) => s.addTask);
  const updateProfilePatch = useGameStore((s) => s.updateProfilePatch);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];

  const [step, setStep] = React.useState(0);
  const [picked, setPicked] = React.useState<FlowerType>(STARTER_TYPES[0] ?? "tulip");
  const [taskName, setTaskName] = React.useState("Drink 8 cups of water");
  const [taskIcon, setTaskIcon] = React.useState(TASK_ICONS[0]);
  const [submitting, setSubmitting] = React.useState(false);

  const finish = async () => {
    if (!profile) return;
    setSubmitting(true);
    try {
      // Gift all starter species so future task-creation has variety.
      for (const t of STARTER_TYPES) {
        await unlockPlant(profile.id, t);
      }
      setInventory(STARTER_TYPES);

      // Create first task + plant the chosen seed.
      await addTask({
        name: taskName.trim() || "Daily habit",
        icon: taskIcon,
        freq: "daily",
        reminderTime: "09:00",
        plantType: picked,
      });

      // Mark onboarded — root layout will route into tabs on next render.
      await updateProfilePatch({ onboarded: true });
      router.replace("/(tabs)/greenhouse");
    } catch (e) {
      console.warn("[onboarding] finish failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bgPanel }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.heroBand}>
        <GreenhouseSky palette={palette} time="day" height={180} />
        <View
          style={[
            styles.floor,
            { backgroundColor: palette.bgFloor, borderTopColor: palette.line },
          ]}
        />
        <View style={styles.heroPlant}>
          <Plant type={picked} stage={step === 0 ? 1 : 4} scale={5} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
      >
        {step === 0 && (
          <Step
            palette={palette}
            title={"Welcome to your\nGreenhouse"}
            body={"Tend tasks. Grow plants.\nMiss days, watch them wilt."}
          />
        )}

        {step === 1 && (
          <View>
            <Step
              palette={palette}
              title={"Pick your\nfirst seed"}
              body={"Each task you complete\nfeeds its plant."}
            />
            <View style={styles.seedRow}>
              {STARTER_TYPES.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setPicked(t)}
                  style={[
                    styles.seedCard,
                    {
                      borderColor: picked === t ? palette.accent : palette.ink,
                      backgroundColor: picked === t ? palette.bgPanel2 : palette.bgPanel,
                    },
                  ]}
                >
                  <Plant type={t} stage={4} scale={3} />
                  <Text
                    style={[
                      styles.seedName,
                      { color: palette.ink, fontFamily: FONTS.body },
                    ]}
                  >
                    {FLOWERS_V2[t].name}
                  </Text>
                  <Text
                    style={[
                      styles.seedDesc,
                      { color: palette.inkSoft, fontFamily: FONTS.body },
                    ]}
                  >
                    {PLANT_CATALOG[t].desc}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View>
            <Step
              palette={palette}
              title={"Your first task"}
              body={"Pick something small.\nDo it daily."}
            />
            <PixelPanel palette={palette} pad={14} style={{ marginTop: 14 }}>
              <Text
                style={[styles.fieldLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}
              >
                NAME
              </Text>
              <TextInput
                value={taskName}
                onChangeText={setTaskName}
                style={[
                  styles.input,
                  { borderColor: palette.ink, color: palette.ink, fontFamily: FONTS.body },
                ]}
              />
              <Text
                style={[
                  styles.fieldLabel,
                  { color: palette.inkSoft, fontFamily: FONTS.displayBold, marginTop: 12 },
                ]}
              >
                ICON
              </Text>
              <View style={styles.iconRow}>
                {TASK_ICONS.map((ic) => (
                  <Pressable
                    key={ic}
                    onPress={() => setTaskIcon(ic)}
                    style={[
                      styles.iconBtn,
                      {
                        borderColor: ic === taskIcon ? palette.accent : palette.ink,
                        backgroundColor: ic === taskIcon ? palette.bgPanel2 : palette.bgPanel,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 20 }}>{ic}</Text>
                  </Pressable>
                ))}
              </View>
            </PixelPanel>
          </View>
        )}

        <View style={styles.dots}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === step ? palette.accent : palette.line,
                  opacity: i === step ? 1 : 0.4,
                },
              ]}
            />
          ))}
        </View>

        <PixelButton
          palette={palette}
          onPress={() => (step < 2 ? setStep(step + 1) : finish())}
          disabled={submitting}
        >
          {step < 2 ? "NEXT" : submitting ? "PLANTING…" : "LET'S GROW →"}
        </PixelButton>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Step({
  palette,
  title,
  body,
}: {
  palette: ReturnType<typeof getPalette>;
  title: string;
  body: string;
}) {
  return (
    <View>
      <Text style={[styles.stepTitle, { color: palette.ink, fontFamily: FONTS.displayBold }]}>
        {title}
      </Text>
      <Text style={[styles.stepBody, { color: palette.inkSoft, fontFamily: FONTS.body }]}>
        {body}
      </Text>
    </View>
  );
}

function getPalette() {
  return PIXEL_PALETTES.terracotta;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  heroBand: { height: 200, position: "relative", overflow: "hidden" },
  floor: { position: "absolute", left: 0, right: 0, bottom: 0, height: 50, borderTopWidth: 3 },
  heroPlant: { position: "absolute", bottom: 30, left: "50%", marginLeft: -70 },
  scroll: { padding: 24, paddingBottom: 48 },
  stepTitle: { fontSize: 26, lineHeight: 32, marginBottom: 8 },
  stepBody: { fontSize: 16, lineHeight: 22 },
  seedRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  seedCard: { flex: 1, padding: 8, borderWidth: 2, alignItems: "center" },
  seedName: { fontSize: 12, marginTop: 4 },
  seedDesc: { fontSize: 10, marginTop: 2, textAlign: "center" },
  fieldLabel: { fontSize: 11, letterSpacing: 1 },
  input: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    marginTop: 6,
  },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 6 },
  iconBtn: {
    width: 38,
    height: 38,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 18,
  },
  dot: { width: 8, height: 8 },
});
