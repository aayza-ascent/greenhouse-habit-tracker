// Shared name/icon/freq/dow/plant/reminder form. Mounted from new-task.tsx
// and edit-task.tsx — both wrap this with their own header + submit handler.
//
// Reminder time uses @react-native-community/datetimepicker. On iOS we render
// a compact inline picker; on Android we open a modal dialog.

import * as React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import DateTimePicker, {
  type DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { Link } from "expo-router";

import { PixelPanel } from "./ui/PixelPanel";
import { Plant } from "./plants/Plant";
import { FLOWERS_V2, type FlowerType } from "./plants/flowers-v2";
import type { Frequency } from "@/domain/economy";
import { FONTS } from "@/theme/fonts";
import type { Palette } from "@/theme/palettes";

const TASK_ICONS = ["💧", "📚", "🏃", "🧘", "✍️", "🥗", "🛏️", "🦷", "🌱", "🎯", "🎵", "☎️"];

const FREQ_OPTIONS: { id: Frequency; label: string }[] = [
  { id: "daily", label: "Daily" },
  { id: "dow", label: "Day-of-week" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
];

const DOW_LABELS = ["M", "T", "W", "T", "F", "S", "S"];

export type TaskFormState = {
  name: string;
  icon: string;
  freq: Frequency;
  dows: number[];
  reminderTime: string | null; // "HH:MM" or null
  plant: FlowerType | null;
};

type Props = {
  palette: Palette;
  ownedPlants: FlowerType[];
  state: TaskFormState;
  onChange: (patch: Partial<TaskFormState>) => void;
  /** When true, hides the plant picker (used by edit-task + onboarding). */
  lockPlant?: boolean;
  /** When true, hides the centered Plant preview (caller already shows one). */
  hidePreview?: boolean;
  /** When true, renders into a plain View rather than a ScrollView. Use this
   *  when the parent already provides scrolling (e.g. onboarding) — avoids
   *  nested-ScrollView weirdness. */
  flat?: boolean;
};

export function TaskForm({
  palette,
  ownedPlants,
  state,
  onChange,
  lockPlant,
  hidePreview,
  flat,
}: Props) {
  const [showPicker, setShowPicker] = React.useState(false);

  const reminderDate = React.useMemo(() => {
    const d = new Date();
    if (state.reminderTime) {
      const [h, m] = state.reminderTime.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    } else {
      d.setHours(9, 0, 0, 0);
    }
    return d;
  }, [state.reminderTime]);

  const onTimePicked = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === "android") setShowPicker(false);
    if (event.type === "dismissed" || !date) return;
    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    onChange({ reminderTime: `${hh}:${mm}` });
  };

  const reminderLabel = state.reminderTime
    ? formatTime(reminderDate)
    : "off";

  const content = (
    <>
      {!hidePreview && (
        <View style={styles.preview}>
          {state.plant ? (
            <Plant type={state.plant} stage={1} scale={5} />
          ) : (
            <View style={{ height: 38 * 5 }} />
          )}
        </View>
      )}

      <Field label="NAME" palette={palette}>
        <TextInput
          value={state.name}
          onChangeText={(t) => onChange({ name: t })}
          placeholder="What will you do?"
          placeholderTextColor={palette.inkSoft + "88"}
          style={[
            styles.input,
            { borderColor: palette.ink, color: palette.ink, fontFamily: FONTS.body },
          ]}
        />
      </Field>

      <Field label="ICON" palette={palette}>
        <View style={styles.iconWrap}>
          {TASK_ICONS.map((ic) => (
            <Pressable
              key={ic}
              onPress={() => onChange({ icon: ic })}
              style={[
                styles.iconBtn,
                {
                  borderColor: ic === state.icon ? palette.accent : palette.ink,
                  backgroundColor: ic === state.icon ? palette.bgPanel2 : palette.bgPanel,
                },
              ]}
            >
              <Text style={{ fontSize: 20 }}>{ic}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="FREQUENCY" palette={palette}>
        <View style={styles.freqGrid}>
          {FREQ_OPTIONS.map((f) => (
            <Pressable
              key={f.id}
              onPress={() => onChange({ freq: f.id })}
              style={[
                styles.freqBtn,
                {
                  borderColor: state.freq === f.id ? palette.accent : palette.ink,
                  backgroundColor: state.freq === f.id ? palette.bgPanel2 : palette.bgPanel,
                },
              ]}
            >
              <Text style={[styles.freqLabel, { color: palette.ink, fontFamily: FONTS.body }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        {state.freq === "dow" && (
          <View style={styles.dowRow}>
            {DOW_LABELS.map((lbl, i) => {
              const dow = i + 1; // ISO 1=Mon..7=Sun
              const on = state.dows.includes(dow);
              return (
                <Pressable
                  key={i}
                  onPress={() =>
                    onChange({
                      dows: on
                        ? state.dows.filter((x) => x !== dow)
                        : [...state.dows, dow].sort(),
                    })
                  }
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
      </Field>

      {!lockPlant && (
        <Field label="LINK TO PLANT" palette={palette}>
          {ownedPlants.length === 0 ? (
            <View
              style={[
                styles.emptyInventory,
                { backgroundColor: palette.bgPanel2, borderColor: palette.line },
              ]}
            >
              <Text
                style={[styles.emptyInvText, { color: palette.inkSoft, fontFamily: FONTS.body }]}
              >
                No seeds owned yet.{" "}
                <Link href="/(tabs)/shop">
                  <Text style={{ color: palette.accent, fontFamily: FONTS.bodySemibold }}>
                    Visit the shop →
                  </Text>
                </Link>
              </Text>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {ownedPlants.map((t) => (
                  <Pressable
                    key={t}
                    onPress={() => onChange({ plant: t })}
                    style={[
                      styles.plantOption,
                      {
                        borderColor: state.plant === t ? palette.accent : palette.ink,
                        backgroundColor:
                          state.plant === t ? palette.bgPanel2 : palette.bgPanel,
                      },
                    ]}
                  >
                    <Plant type={t} stage={4} scale={2} />
                    <Text
                      style={[
                        styles.plantName,
                        { color: palette.ink, fontFamily: FONTS.body },
                      ]}
                    >
                      {FLOWERS_V2[t].name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </Field>
      )}

      {/* Reminder — toggle + time chip; the chip opens the picker on tap. */}
      <PixelPanel palette={palette} pad={10} color={palette.bgPanel2} style={{ marginTop: 8 }}>
        <View style={styles.reminderRow}>
          <Text style={{ fontSize: 18 }}>🔔</Text>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: FONTS.body, fontSize: 13, color: palette.inkSoft }}>
              Daily reminder
            </Text>
            {state.reminderTime && (
              <Pressable onPress={() => setShowPicker(true)} style={{ marginTop: 2 }}>
                <Text
                  style={{
                    fontFamily: FONTS.displayBold,
                    color: palette.ink,
                    fontSize: 16,
                  }}
                >
                  {reminderLabel}
                </Text>
              </Pressable>
            )}
            {!state.reminderTime && (
              <Text style={{ fontFamily: FONTS.body, color: palette.inkSoft, marginTop: 2 }}>
                {reminderLabel}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() =>
              onChange({ reminderTime: state.reminderTime ? null : "09:00" })
            }
            style={[
              styles.toggle,
              {
                backgroundColor: state.reminderTime ? palette.leafL : palette.line,
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
                  [state.reminderTime ? "right" : "left"]: 0,
                } as any,
              ]}
            />
          </Pressable>
        </View>
        {/* iOS inline-compact picker; Android is modal-only. */}
        {state.reminderTime && Platform.OS === "ios" && showPicker && (
          <View style={{ alignItems: "center", marginTop: 8 }}>
            <DateTimePicker
              value={reminderDate}
              mode="time"
              display="spinner"
              onChange={onTimePicked}
            />
          </View>
        )}
        {state.reminderTime && Platform.OS === "android" && showPicker && (
          <DateTimePicker
            value={reminderDate}
            mode="time"
            display="default"
            onChange={onTimePicked}
          />
        )}
      </PixelPanel>
    </>
  );

  if (flat) {
    return <View style={styles.scroll}>{content}</View>;
  }
  return (
    <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
      {content}
    </ScrollView>
  );
}

function Field({
  label,
  palette,
  children,
}: {
  label: string;
  palette: Palette;
  children: React.ReactNode;
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={[
          styles.fieldLabel,
          { color: palette.inkSoft, fontFamily: FONTS.displayBold },
        ]}
      >
        {label}
      </Text>
      {children}
    </View>
  );
}

function formatTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const styles = StyleSheet.create({
  scroll: { padding: 16, paddingBottom: 80 },
  preview: { alignItems: "center", marginBottom: 14, minHeight: 200 },
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
  plantOption: { padding: 6, borderWidth: 2, alignItems: "center" },
  plantName: { fontSize: 11, marginTop: 2 },
  emptyInventory: { padding: 12, borderWidth: 2, borderStyle: "dashed" },
  emptyInvText: { fontSize: 13 },
  reminderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  toggle: { width: 36, height: 20, borderWidth: 2, position: "relative" },
  toggleKnob: { position: "absolute", top: 0, bottom: 0, width: 16, borderWidth: 2 },
});
