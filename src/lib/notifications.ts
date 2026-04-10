import { AgendaItem } from "./storage";

const SCHEDULED_KEY = "hub_scheduled_alarms";

// Request browser notification permission
export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  const result = await Notification.requestPermission();
  return result === "granted";
}

// Show an immediate notification
export function showNotification(title: string, body: string, tag?: string) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const n = new Notification(title, {
    body,
    tag: tag || "hub-notif",
    icon: "/pwa-192x192.png",
    badge: "/pwa-192x192.png",
    requireInteraction: false,
  });
  // Auto-close after 8s
  setTimeout(() => n.close(), 8000);
  return n;
}

// Play alarm sound using AudioContext
export function playAlarmSound(duration = 3) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const times = [0, 0.4, 0.8, 1.2];
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

// Store scheduled timeout IDs
const activeTimers = new Map<string, ReturnType<typeof setTimeout>[]>();

// Schedule reminders for an AgendaItem:
// - 5 minutes before: warning notification
// - At exact time: alarm notification + in-app overlay
export function scheduleReminder(
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

  // 5-minute warning
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

  // Exact time alarm
  const msToEvent = eventMs - now;
  if (msToEvent > 0) {
    timers.push(
      setTimeout(() => {
        showNotification(
          "🔔 AGORA: " + item.title,
          item.notes ? item.notes : `Seu compromisso está começando!`,
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
export function cancelReminder(id: string) {
  const timers = activeTimers.get(id);
  if (timers) {
    timers.forEach(clearTimeout);
    activeTimers.delete(id);
  }
}

// Cancel all timers
export function cancelAllReminders() {
  activeTimers.forEach((timers) => timers.forEach(clearTimeout));
  activeTimers.clear();
}

// Re-schedule all pending items (call on app boot)
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
