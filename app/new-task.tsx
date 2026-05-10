// New Task creation modal — name, icon, frequency, day-of-week picker (when
// freq=dow), plant link, optional reminder. Ported from
// greenhouse-prototype-design/project/screens.jsx → NewTaskScreen.

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

import { PixelButton } from "@/components/ui/PixelButton";
import { PixelPanel } from "@/components/ui/PixelPanel";
import { Plant } from "@/components/plants/Plant";
import type { Frequency } from "@/domain/economy";
import type { FlowerType } from "@/components/plants/flowers-v2";
import { FLOWERS_V2 } from "@/components/plants/flowers-v2";
import { useGameStore } from "@/store/useGameStore";
import { ensurePermission, scheduleForTask } from "@/notifications/schedule";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

const TASK_ICONS = ["💧", "📚", "🏃", "🧘", "✍️", "🥗", "🛏️", "🦷", "🌱", "🎯", "🎵", "☎️"];
const FREQ_OPTIONS: { id: Frequency; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "dow", label: "Mon/Wed/Fri" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];
const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export default function NewTask() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const inventory = useGameStore((s) => s.inventory);
  const addTask = useGameStore((s) => s.addTask);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const owned: FlowerType[] = inventory.length > 0 ? inventory : ["rose", "tulip", "sunflower"];

  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("🌱");
  const [freq, setFreq] = React.useState<Frequency>("daily");
  const [dows, setDows] = React.useState<number[]>([1, 3, 5]);
  const [plant, setPlant] = React.useState<FlowerType | null>(owned[0] ?? null);
  const [reminderOn, setReminderOn] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);

  const onSave = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      const task = await addTask({
        name: name.trim(),
        icon,
        freq,
        dows: freq === "dow" ? dows : [],
        reminderTime: reminderOn ? "09:00" : null,
        plantType: plant,
      });
      if (reminderOn) {
        const ok = await ensurePermission();
        if (ok) await scheduleForTask(task);
      }
      router.back();
    } catch (e) {
      console.warn("[new-task] save failed", e);
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDow = (d: number) => {
    setDows((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: palette.bgPanel }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { borderBottomColor: palette.ink }]}>
        <Pressable onPress={() => router.back()}>
          <Text style={{ fontFamily: FONTS.body, color: palette.inkSoft, fontSize: 14 }}>
            ✕ Cancel
          </Text>
        </Pressable>
        <Text style={[styles.title, { fontFamily: FONTS.displayBold, color: palette.ink }]}>
          NEW TASK
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Plant preview */}
        <View style={styles.preview}>
          {plant && <Plant type={plant} stage={1} scale={5} />}
        </View>

        <FormField label="NAME" palette={palette}>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="What will you do?"
            placeholderTextColor={palette.inkSoft + "88"}
            style={[
              styles.input,
              { borderColor: palette.ink, color: palette.ink, fontFamily: FONTS.body },
            ]}
          />
        </FormField>

        <FormField label="ICON" palette={palette}>
          <View style={styles.iconWrap}>
            {TASK_ICONS.map((ic) => (
              <Pressable
                key={ic}
                onPress={() => setIcon(ic)}
                style={[
                  styles.iconBtn,
                  {
                    borderColor: ic === icon ? palette.accent : palette.ink,
                    backgroundColor: ic === icon ? palette.bgPanel2 : palette.bgPanel,
                  },
                ]}
              >
                <Text style={{ fontSize: 20 }}>{ic}</Text>
              </Pressable>
            ))}
          </View>
        </FormField>

        <FormField label="FREQUENCY" palette={palette}>
          <View style={styles.freqGrid}>
            {FREQ_OPTIONS.map((f) => (
              <Pressable
                key={f.id}
                onPress={() => setFreq(f.id)}
                style={[
                  styles.freqBtn,
                  {
                    borderColor: freq === f.id ? palette.accent : palette.ink,
                    backgroundColor: freq === f.id ? palette.bgPanel2 : palette.bgPanel,
                  },
                ]}
              >
                <Text style={[styles.freqLabel, { color: palette.ink, fontFamily: FONTS.body }]}>
                  {f.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {freq === "dow" && (
            <View style={styles.dowRow}>
              {DOW_LABELS.map((lbl, i) => {
                const dow = i + 1; // ISO 1=Mon..7=Sun
                const on = dows.includes(dow);
                return (
                  <Pressable
                    key={i}
                    onPress={() => toggleDow(dow)}
                    style={[
                      styles.dowBtn,
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
                        fontSize: 12,
                      }}
                    >
                      {lbl}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </FormField>

        <FormField label="LINK TO PLANT" palette={palette}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              {owned.map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setPlant(t)}
                  style={[
                    styles.plantOption,
                    {
                      borderColor: plant === t ? palette.accent : palette.ink,
                      backgroundColor: plant === t ? palette.bgPanel2 : palette.bgPanel,
                    },
                  ]}
                >
                  <Plant type={t} stage={4} scale={2} />
                  <Text
                    style={[styles.plantName, { color: palette.ink, fontFamily: FONTS.body }]}
                  >
                    {FLOWERS_V2[t].name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </FormField>

        <PixelPanel palette={palette} pad={10} color={palette.bgPanel2} style={{ marginTop: 8 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text style={{ fontSize: 18 }}>🔔</Text>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.inkSoft, flex: 1 }}>
              Remind me at <Text style={{ color: palette.ink }}>9:00 AM</Text>
            </Text>
            <Pressable
              onPress={() => setReminderOn((v) => !v)}
              style={[
                styles.toggle,
                {
                  backgroundColor: reminderOn ? palette.leafL : palette.line,
                  borderColor: palette.ink,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleKnob,
                  {
                    backgroundColor: palette.bgPanel,
                    borderColor: palette.ink,
                    [reminderOn ? "right" : "left"]: 0,
                  } as any,
                ]}
              />
            </Pressable>
          </View>
        </PixelPanel>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { borderTopColor: palette.ink, backgroundColor: palette.bgPanel },
        ]}
      >
        <PixelButton
          palette={palette}
          onPress={onSave}
          disabled={!name.trim() || submitting}
        >
          {submitting ? "PLANTING…" : "PLANT IT 🌱"}
        </PixelButton>
      </View>
    </KeyboardAvoidingView>
  );
}

function FormField({
  label,
  palette,
  children,
}: {
  label: string;
  palette: ReturnType<typeof getPalette>;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.fieldLabel, { color: palette.inkSoft, fontFamily: FONTS.displayBold }]}>
        {label}
      </Text>
      {children}
    </View>
  );
}

function getPalette() {
  return PIXEL_PALETTES.terracotta;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, letterSpacing: 1 },
  scroll: { padding: 16, paddingBottom: 80 },
  preview: { alignItems: "center", marginBottom: 14 },
  fieldLabel: { fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  input: {
    borderWidth: 2,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 16,
  },
  iconWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  iconBtn: {
    width: 38,
    height: 38,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  freqGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  freqBtn: {
    width: "48%",
    borderWidth: 2,
    paddingVertical: 10,
    alignItems: "center",
  },
  freqLabel: { fontSize: 14 },
  dowRow: { flexDirection: "row", gap: 6, marginTop: 10 },
  dowBtn: {
    flex: 1,
    aspectRatio: 1,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  plantOption: {
    padding: 6,
    borderWidth: 2,
    alignItems: "center",
  },
  plantName: { fontSize: 11, marginTop: 2 },
  toggle: {
    width: 36,
    height: 20,
    borderWidth: 2,
    position: "relative",
  },
  toggleKnob: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 16,
    borderWidth: 2,
  },
  footer: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: 2,
  },
});
