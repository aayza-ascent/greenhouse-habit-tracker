// Edit Task modal. Reuses the shared <TaskForm>; pre-fills from store.
// Reminders: cancels any previously scheduled local notifications and
// re-schedules from the new state.
//
// Plant link is locked at create time — reassigning a plant mid-life would
// break stage-derivation continuity. Delete + recreate if you need to swap.

import * as React from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { PixelButton } from "@/components/ui/PixelButton";
import { TaskForm, type TaskFormState } from "@/components/TaskForm";
import { useGameStore } from "@/store/useGameStore";
import { updateTask as updateTaskApi } from "@/data/tasks";
import { ensurePermission, scheduleForTask } from "@/notifications/schedule";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";

export default function EditTask() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const profile = useGameStore((s) => s.profile);
  const inventory = useGameStore((s) => s.inventory);
  const tasks = useGameStore((s) => s.tasks);
  const upsertTask = useGameStore((s) => s.upsertTask);

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const task = tasks.find((t) => t.id === id);

  const [state, setState] = React.useState<TaskFormState>(() => ({
    name: task?.name ?? "",
    icon: task?.icon ?? "🌱",
    freq: task?.freq ?? "daily",
    dows: task?.dows ?? [],
    reminderTime: task?.reminderTime ?? null,
    durationMinutes: task?.durationMinutes ?? 15,
    plant: null, // hidden in edit mode
  }));
  const [submitting, setSubmitting] = React.useState(false);

  if (!task) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bgPanel, padding: 32 }]}>
        <Text style={{ color: palette.ink, fontFamily: FONTS.body }}>Task not found.</Text>
      </View>
    );
  }

  const onSave = async () => {
    if (!state.name.trim()) return;
    setSubmitting(true);
    try {
      const updated = await updateTaskApi(task.id, {
        name: state.name.trim(),
        icon: state.icon,
        freq: state.freq,
        dows: state.freq === "dow" ? state.dows : [],
        reminderTime: state.reminderTime,
        durationMinutes: state.durationMinutes,
      });
      upsertTask(updated);
      if (updated.reminderTime) {
        const ok = await ensurePermission();
        if (ok) await scheduleForTask(updated);
      }
      router.back();
    } catch (e) {
      console.warn("[edit-task] save failed", e);
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
          EDIT TASK
        </Text>
        <View style={{ width: 60 }} />
      </View>

      <TaskForm
        palette={palette}
        ownedPlants={inventory}
        state={state}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
        lockPlant
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
          {submitting ? "SAVING…" : "SAVE"}
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
