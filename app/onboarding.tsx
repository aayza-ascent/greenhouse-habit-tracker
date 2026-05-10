// Three-step onboarding: welcome → pick first seed → set up first task
// (full new-task form: name, icon, frequency, day-of-week, reminder time).
// On finish: gifts the three starter species in inventory_owned, plants the
// chosen seed, creates the first task linked to it, sets profiles.onboarded,
// and navigates to /(tabs)/greenhouse.

import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { GreenhouseSky } from "@/components/GreenhouseSky";
import { Plant } from "@/components/plants/Plant";
import { FLOWERS_V2, type FlowerType } from "@/components/plants/flowers-v2";
import { PLANT_CATALOG, STARTER_TYPES } from "@/components/plants/catalog";
import { PixelButton } from "@/components/ui/PixelButton";
import { TaskForm, type TaskFormState } from "@/components/TaskForm";
import { unlockPlant } from "@/data/inventory";
import { useGameStore } from "@/store/useGameStore";
import { ensurePermission, scheduleForTask } from "@/notifications/schedule";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function Onboarding() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const setInventory = useGameStore((s) => s.setInventory);
  const addTask = useGameStore((s) => s.addTask);
  const updateProfilePatch = useGameStore((s) => s.updateProfilePatch);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];

  const [step, setStep] = React.useState(0);
  const [picked, setPicked] = React.useState<FlowerType>(STARTER_TYPES[0] ?? "tulip");
  const [formState, setFormState] = React.useState<TaskFormState>({
    name: "Drink 8 cups of water",
    icon: "💧",
    freq: "daily",
    dows: [1, 3, 5],
    reminderTime: "09:00",
    plant: STARTER_TYPES[0] ?? "tulip",
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Keep TaskForm's plant in sync with the seed picked in step 1 — even
  // though the form's plant picker is locked, the preview/Plant references
  // need to match the current selection.
  React.useEffect(() => {
    setFormState((s) => ({ ...s, plant: picked }));
  }, [picked]);

  const finish = async () => {
    if (!profile) return;
    if (!formState.name.trim()) return;
    setSubmitting(true);
    try {
      // Gift all starter species so future task-creation has variety.
      for (const t of STARTER_TYPES) {
        await unlockPlant(profile.id, t);
      }
      setInventory(STARTER_TYPES);

      // Create first task + plant the chosen seed in the greenhouse.
      const task = await addTask({
        name: formState.name.trim(),
        icon: formState.icon,
        freq: formState.freq,
        dows: formState.freq === "dow" ? formState.dows : [],
        reminderTime: formState.reminderTime,
        plantType: picked,
      });
      if (formState.reminderTime) {
        const ok = await ensurePermission();
        if (ok) await scheduleForTask(task);
      }

      // Mark onboarded — root layout will route into tabs on next render.
      await updateProfilePatch({ onboarded: true });
      router.replace("/(tabs)/greenhouse");
    } catch (e) {
      console.warn("[onboarding] finish failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  const heroHeight = step === 2 ? 140 : 200;
  const heroPlantStage = step === 0 ? 1 : 4;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bgPanel }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.heroBand, { height: heroHeight }]}>
        <GreenhouseSky palette={palette} time="day" height={heroHeight} />
        <View
          style={[
            styles.floor,
            { backgroundColor: palette.bgFloor, borderTopColor: palette.line },
          ]}
        />
        <View style={[styles.heroPlant, { bottom: step === 2 ? 22 : 30 }]}>
          <Plant type={picked} stage={heroPlantStage} scale={step === 2 ? 4 : 5} />
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
              body={"Pick something small.\nWe'll remind you."}
            />
            <TaskForm
              palette={palette}
              ownedPlants={[picked]}
              state={formState}
              onChange={(patch) => setFormState((s) => ({ ...s, ...patch }))}
              lockPlant
              hidePreview
              flat
            />
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
          disabled={submitting || (step === 2 && !formState.name.trim())}
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
  heroBand: { position: "relative", overflow: "hidden" },
  floor: { position: "absolute", left: 0, right: 0, bottom: 0, height: 50, borderTopWidth: 3 },
  heroPlant: { position: "absolute", left: "50%", marginLeft: -56 },
  scroll: { padding: 24, paddingBottom: 48 },
  stepTitle: { fontSize: 26, lineHeight: 32, marginBottom: 8 },
  stepBody: { fontSize: 16, lineHeight: 22 },
  seedRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  seedCard: { flex: 1, padding: 8, borderWidth: 2, alignItems: "center" },
  seedName: { fontSize: 12, marginTop: 4 },
  seedDesc: { fontSize: 10, marginTop: 2, textAlign: "center" },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    marginVertical: 18,
  },
  dot: { width: 8, height: 8 },
});
