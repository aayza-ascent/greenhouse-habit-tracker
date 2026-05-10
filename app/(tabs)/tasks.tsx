// Tasks tab — grouped by frequency, progress bar, complete/uncomplete buttons.
// Ported from greenhouse-prototype-design/project/screens.jsx → TasksScreen.

import * as React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { HUD } from "@/components/ui/HUD";
import { PixelButton } from "@/components/ui/PixelButton";
import { Plant } from "@/components/plants/Plant";
import { FREQ_COIN, FREQ_XP } from "@/domain/economy";
import { isCompletedToday } from "@/domain/schedule";
import { useGameStore } from "@/store/useGameStore";
import { FONTS } from "@/theme/fonts";
import { PIXEL_PALETTES } from "@/theme/palettes";
import type { Frequency } from "@/domain/economy";
import type { Task } from "@/data/types";

const FREQ_LABEL: Record<Frequency, string> = {
  daily: "Daily",
  dow: "Mon · Wed · Fri",
  weekly: "This Week",
  monthly: "This Month",
};

export default function TasksScreen() {
  const profile = useGameStore((s) => s.profile);
  const tasks = useGameStore((s) => s.tasks);
  const plants = useGameStore((s) => s.plants);
  const completeTask = useGameStore((s) => s.completeTask);
  const uncompleteTask = useGameStore((s) => s.uncompleteTask);
  const deleteTask = useGameStore((s) => s.deleteTask);
  const router = useRouter();

  const onLongPressTask = (task: Task) => {
    Alert.alert(task.name, undefined, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Edit",
        onPress: () => router.push({ pathname: "/edit-task", params: { id: task.id } }),
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            `Delete "${task.name}"?`,
            "The linked plant will be removed from your greenhouse. Your past completions stay in your stats.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Delete",
                style: "destructive",
                onPress: () =>
                  deleteTask(task.id).catch((e) => console.warn("[delete-task]", e)),
              },
            ],
          ),
      },
    ]);
  };

  const palette = PIXEL_PALETTES[profile?.paletteKey ?? "terracotta"];
  const tz = profile?.tz ?? "UTC";

  // Sort each group by reminder time (earliest → latest). Tasks without a
  // reminder fall to the bottom in their original relative order.
  const groups: { id: Frequency; label: string; items: Task[] }[] = (
    ["daily", "dow", "weekly", "monthly"] as Frequency[]
  )
    .map((id) => ({
      id,
      label: FREQ_LABEL[id],
      items: tasks
        .filter((t) => t.freq === id)
        .slice()
        .sort((a, b) => {
          if (!a.reminderTime && !b.reminderTime) return 0;
          if (!a.reminderTime) return 1;
          if (!b.reminderTime) return -1;
          return a.reminderTime.localeCompare(b.reminderTime);
        }),
    }))
    .filter((g) => g.items.length > 0);

  const dailyTasks = tasks.filter((t) => t.freq === "daily");
  const todayDone = dailyTasks.filter((t) => isCompletedToday(t, tz)).length;
  const todayTot = dailyTasks.length;

  return (
    <View style={[styles.root, { backgroundColor: palette.bgPanel }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: palette.bgPanel },
        ]}
      >
        <View>
          <Text style={[styles.title, { fontFamily: FONTS.displayBold, color: palette.ink }]}>
            TODAY
          </Text>
          <Text style={[styles.sub, { fontFamily: FONTS.body, color: palette.inkSoft }]}>
            {new Date().toLocaleDateString(undefined, {
              weekday: "long",
              month: "short",
              day: "numeric",
            })}
          </Text>
        </View>
        <HUD
          palette={palette}
          coins={profile?.coins ?? 0}
          xp={profile?.xp ?? 0}
          streak={profile?.streak ?? 0}
        />
      </View>

      <View style={styles.progressWrap}>
        <View
          style={[
            styles.progressOuter,
            { backgroundColor: palette.bgPanel2, borderColor: palette.ink },
          ]}
        >
          <View
            style={[
              styles.progressInner,
              {
                backgroundColor: palette.leafL,
                width: `${(todayDone / Math.max(1, todayTot)) * 100}%`,
              },
            ]}
          />
          <Text
            style={[
              styles.progressLabel,
              { color: palette.ink, fontFamily: FONTS.displayBold },
            ]}
          >
            {todayDone}/{todayTot} TODAY
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        {tasks.length === 0 && (
          <View style={styles.empty}>
            <Text
              style={[styles.emptyText, { color: palette.inkSoft, fontFamily: FONTS.body }]}
            >
              No tasks yet. Plant your first habit below.
            </Text>
          </View>
        )}
        {tasks.length > 0 && (
          <Text
            style={[
              styles.hint,
              { color: palette.inkSoft, fontFamily: FONTS.body },
            ]}
          >
            Long-press a task to edit or delete it.
          </Text>
        )}
        {groups.map((g) => (
          <View key={g.id} style={{ paddingHorizontal: 14 }}>
            <Text
              style={[
                styles.groupLabel,
                { color: palette.inkSoft, fontFamily: FONTS.displayBold },
              ]}
            >
              {g.label.toUpperCase()}
            </Text>
            {g.items.map((task) => {
              const linked = plants.find((p) => p.id === task.plantId);
              const done = isCompletedToday(task, tz);
              return (
                <Pressable
                  key={task.id}
                  onLongPress={() => onLongPressTask(task)}
                  delayLongPress={500}
                  style={[
                    styles.taskRow,
                    {
                      backgroundColor: done ? palette.bgPanel2 : palette.bgPanel,
                      borderColor: palette.ink,
                      opacity: done ? 0.7 : 1,
                    },
                  ]}
                >
                  <Pressable
                    onPress={() => (done ? uncompleteTask(task.id) : completeTask(task.id))}
                    style={[
                      styles.checkBtn,
                      {
                        backgroundColor: done ? palette.leafL : palette.bgPanel,
                        borderColor: palette.ink,
                      },
                    ]}
                  >
                    {done && (
                      <Text style={[styles.checkText, { fontFamily: FONTS.displayBold }]}>
                        ✓
                      </Text>
                    )}
                  </Pressable>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.taskName,
                        {
                          color: palette.ink,
                          fontFamily: FONTS.bodySemibold,
                          textDecorationLine: done ? "line-through" : "none",
                        },
                      ]}
                    >
                      {task.icon} {task.name}
                    </Text>
                    <Text
                      style={[
                        styles.taskMeta,
                        { color: palette.inkSoft, fontFamily: FONTS.body },
                      ]}
                    >
                      🔥 {task.streak}d   +{FREQ_COIN[task.freq]}🪙   +{FREQ_XP[task.freq]} XP   ⏱ {formatDuration(task.durationMinutes)}
                      {task.reminderTime ? `   🔔 ${formatTime(task.reminderTime)}` : ""}
                    </Text>
                  </View>
                  {linked && (
                    <View style={{ opacity: done ? 0.6 : 1 }}>
                      <Plant type={linked.type} stage={linked.stageIdx} scale={2} />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        ))}
        <View style={{ paddingHorizontal: 14, paddingTop: 12 }}>
          <PixelButton
            palette={palette}
            color={palette.leafL}
            onPress={() => router.push("/new-task")}
          >
            + NEW TASK
          </PixelButton>
        </View>
      </ScrollView>
    </View>
  );
}

function formatDuration(mins: number): string {
  if (mins >= 60 && mins % 60 === 0) return `${mins / 60}h`;
  if (mins >= 60) return `${Math.floor(mins / 60)}h${mins % 60}m`;
  return `${mins}m`;
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: { fontSize: 18, letterSpacing: 1 },
  sub: { fontSize: 12, marginTop: 2 },
  progressWrap: { paddingHorizontal: 14, paddingBottom: 12 },
  progressOuter: {
    height: 18,
    borderWidth: 2,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressInner: { position: "absolute", left: 0, top: 0, bottom: 0 },
  progressLabel: {
    textAlign: "center",
    fontSize: 10,
    letterSpacing: 1,
    zIndex: 2,
  },
  empty: { padding: 32, alignItems: "center" },
  emptyText: { fontSize: 14 },
  hint: {
    fontSize: 11,
    textAlign: "center",
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 14,
    fontStyle: "italic",
  },
  groupLabel: { fontSize: 11, letterSpacing: 1, paddingTop: 16, paddingBottom: 6 },
  taskRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 2,
  },
  checkBtn: {
    width: 32,
    height: 32,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 16 },
  taskName: { fontSize: 16 },
  taskMeta: { fontSize: 11, marginTop: 2 },
});
