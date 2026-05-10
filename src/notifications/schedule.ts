// Local notification scheduling for task reminders. Each frequency maps
// to an Expo trigger pattern:
//   daily → CALENDAR with hour/minute repeats
//   dow   → multiple WEEKLY triggers (one per ISO day in dows)
//   weekly→ WEEKLY trigger anchored on createdAt's weekday
//   monthly→ one-shot scheduled to fire at next month boundary; rescheduled
//            on completion (handled by caller)
//
// We keep a 1:1 mapping of taskId → array-of-notificationIds in storage so
// we can cancel + re-schedule on edit.

import * as Notifications from "expo-notifications";
import type { Task } from "@/data/types";

export async function ensurePermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(":").map(Number);
  return { hour: h, minute: m };
}

export async function scheduleForTask(task: Task): Promise<string[]> {
  if (!task.reminderTime) return [];
  const { hour, minute } = parseTime(task.reminderTime);
  const ids: string[] = [];
  const baseContent = {
    title: `${task.icon} ${task.name}`,
    body: "Time to tend your greenhouse.",
    data: { taskId: task.id },
  };

  if (task.freq === "daily") {
    const id = await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute,
        repeats: true,
      } as Notifications.CalendarTriggerInput,
    });
    ids.push(id);
  } else if (task.freq === "dow") {
    for (const dow of task.dows) {
      // Expo weekday: 1=Sun..7=Sat — convert from ISO 1=Mon..7=Sun.
      const expoWeekday = dow === 7 ? 1 : dow + 1;
      const id = await Notifications.scheduleNotificationAsync({
        content: baseContent,
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: expoWeekday,
          hour,
          minute,
        } as Notifications.WeeklyTriggerInput,
      });
      ids.push(id);
    }
  } else if (task.freq === "weekly") {
    const expoWeekday = ((new Date().getDay() + 6) % 7) + 1; // current weekday
    const id = await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: expoWeekday,
        hour,
        minute,
      } as Notifications.WeeklyTriggerInput,
    });
    ids.push(id);
  } else if (task.freq === "monthly") {
    // Fire once 30 days from now; rescheduled by caller on completion.
    const fireAt = new Date(Date.now() + 30 * 86400 * 1000);
    fireAt.setHours(hour, minute, 0, 0);
    const id = await Notifications.scheduleNotificationAsync({
      content: baseContent,
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: fireAt,
      } as Notifications.DateTriggerInput,
    });
    ids.push(id);
  }
  return ids;
}

export async function cancelIds(ids: string[]): Promise<void> {
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
