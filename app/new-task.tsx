// New Task creation modal — wraps the shared <TaskForm> with header + save.

import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { PixelButton } from "@/components/ui/PixelButton";
import { TaskForm, type TaskFormState } from "@/components/TaskForm";
import { useGameStore } from "@/store/useGameStore";
import { ensurePermission, scheduleForTask } from "@/notifications/schedule";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function NewTask() {
  const router = useRouter();
  const profile = useGameStore((s) => s.profile);
  const inventory = useGameStore((s) => s.inventory);
  const addTask = useGameStore((s) => s.addTask);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];

  const [state, setState] = React.useState<TaskFormState>({
    name: "",
    icon: "🌱",
    freq: "daily",
    dows: [1, 3, 5],
    reminderTime: "09:00",
    durationMinutes: 15,
    plant: inventory[0] ?? null,
  });
  const [submitting, setSubmitting] = React.useState(false);

  // Default plant once inventory hydrates.
  React.useEffect(() => {
    if (!state.plant && inventory.length > 0) {
      setState((s) => ({ ...s, plant: inventory[0] }));
    }
  }, [inventory.length]);

  const onSave = async () => {
    if (!state.name.trim()) return;
    setSubmitting(true);
    try {
      const task = await addTask({
        name: state.name.trim(),
        icon: state.icon,
        freq: state.freq,
        dows: state.freq === "dow" ? state.dows : [],
        reminderTime: state.reminderTime,
        durationMinutes: state.durationMinutes,
        plantType: state.plant,
      });
      if (state.reminderTime) {
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

      <TaskForm
        palette={palette}
        ownedPlants={inventory}
        state={state}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
      />

      <View
        style={[
          styles.footer,
          { borderTopColor: palette.ink, backgroundColor: palette.bgPanel },
        ]}
      >
        <PixelButton
          palette={palette}
          onPress={onSave}
          disabled={!state.name.trim() || submitting}
        >
          {submitting ? "PLANTING…" : "PLANT IT 🌱"}
        </PixelButton>
      </View>
    </KeyboardAvoidingView>
  );
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
  footer: { padding: 16, paddingBottom: 24, borderTopWidth: 2 },
});
