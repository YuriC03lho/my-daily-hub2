import { LocalNotifications } from "@capacitor/local-notifications";
import { AgendaItem } from "./storage";

const SCHEDULED_KEY = "hub_scheduled_alarms";

// Request notification permission (both Web and Capacitor)
export async function requestNotificationPermission(): Promise<boolean> {
  // Capacitor Native request
  const native = await LocalNotifications.requestPermissions();
  if (native.display === "granted") return true;

  // Web Fallback
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Show an immediate notification
export async function showNotification(title: string, body: string, tag?: string) {
  // Try Native first
  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          title,
          body,
          id: Math.floor(Math.random() * 100000),
          extra: { tag },
        },
      ],
    });
  } catch (e) {
    // Web Fallback
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    const n = new Notification(title, {
      body,
      tag: tag || "hub-notif",
      icon: "/pwa-192x192.png",
      badge: "/pwa-192x192.png",
    });
    setTimeout(() => n.close(), 8000);
  }
}

// Play alarm sound using AudioContext (Foreground)
export function playAlarmSound(duration = 3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const times = [0, 0.4, 0.8, 1.2, 1.6, 2.0, 2.4, 2.8];
    times.forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime + t);
      osc.frequency.setValueAtTime(660, ctx.currentTime + t + 0.15);
      gain.gain.setValueAtTime(0.5, ctx.currentTime + t);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + t + 0.35);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.35);
    });
    setTimeout(() => ctx.close(), (duration + 2) * 1000);
  } catch {
    // AudioContext not supported
  }
}

// Store scheduled timeout IDs (for Foreground)
const activeTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

// Schedule reminders for an AgendaItem:
export async function scheduleReminder(
  item: AgendaItem,
  onAlarm: (item: AgendaItem) => void
) {
  if (!item.time || item.completed) return;
  cancelReminder(item.id);

  const eventDate = new Date(`${item.date}T${item.time}:00`);
  const now = Date.now();
  const eventMs = eventDate.getTime();
  const fiveMinBefore = eventMs - 5 * 60 * 1000;

  const timers: ReturnType<typeof setTimeout>[] = [];

  // --- NATIVE (Background) scheduling ---
  try {
    const nativeNotifications = [];

    // 5-minute warning
    if (fiveMinBefore > now) {
      nativeNotifications.push({
        title: "⏰ Lembrete em 5 minutos!",
        body: `${item.title} começa às ${item.time}`,
        id: parseInt(item.id.slice(0, 8), 36) + 1, // pseudo-unique numeric ID
        schedule: { at: new Date(fiveMinBefore) },
        sound: "beep.wav", // Fallback if exists
      });
    }

    // Exact time alarm
    if (eventMs > now) {
      nativeNotifications.push({
        title: "🔔 AGORA: " + item.title,
        body: item.notes || `Seu compromisso está começando!`,
        id: parseInt(item.id.slice(0, 8), 36),
        schedule: { at: new Date(eventMs) },
        sound: "alarm.wav",
      });
    }

    if (nativeNotifications.length > 0) {
      await LocalNotifications.schedule({ notifications: nativeNotifications as any });
    }
  } catch (e) {
    console.error("Native notification failed, falling back to Web timers", e);
  }

  // --- WEB TIMERS (Foreground) scheduling ---
  // We keep timers so if the app IS open, we trigger the AlarmOverlay
  const msTo5min = fiveMinBefore - now;
  if (msTo5min > 0) {
    timers.push(
      setTimeout(() => {
        showNotification(
          "⏰ Lembrete em 5 minutos!",
          `${item.title} começa às ${item.time}`,
          `reminder-5-${item.id}`
        );
      }, msTo5min)
    );
  }

  const msToEvent = eventMs - now;
  if (msToEvent > 0) {
    timers.push(
      setTimeout(() => {
        showNotification(
          "🔔 AGORA: " + item.title,
          item.notes || `Seu compromisso está começando!`,
          `alarm-${item.id}`
        );
        playAlarmSound();
        onAlarm(item);
      }, msToEvent)
    );
  }

  if (timers.length > 0) {
    activeTimers.set(item.id, timers);
  }
}

// Cancel timers for a specific item
export async function cancelReminder(id: string) {
  // Cancel Web Timers
  const timers = activeTimers.get(id);
  if (timers) {
    timers.forEach(clearTimeout);
    activeTimers.delete(id);
  }

  // Cancel Native
  try {
    const numericId = parseInt(id.slice(0, 8), 36);
    await LocalNotifications.cancel({
      notifications: [{ id: numericId }, { id: numericId + 1 }],
    });
  } catch (e) {}
}

export function cancelAllReminders() {
  activeTimers.forEach((timers) => timers.forEach(clearTimeout));
  activeTimers.clear();
  try {
    LocalNotifications.cancel({ notifications: [] }); // Cancel all
  } catch (e) {}
}

export function scheduleAllReminders(
  items: AgendaItem[],
  onAlarm: (item: AgendaItem) => void
) {
  cancelAllReminders();
  const now = Date.now();
  items.forEach((item) => {
    if (item.time && !item.completed) {
      const eventMs = new Date(`${item.date}T${item.time}:00`).getTime();
      if (eventMs > now) {
        scheduleReminder(item, onAlarm);
      }
    }
  });
}
