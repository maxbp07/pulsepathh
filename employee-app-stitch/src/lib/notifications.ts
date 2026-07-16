/**
 * PulsePath — recordatorios PWA (check-in diario).
 * Requiere HTTPS + permiso concedido.
 */
const REMINDER_KEY = 'pulsepath.remindersEnabled';
const REMINDER_HOUR = 9; // 09:00 hora local

export function areRemindersEnabled(): boolean {
  try {
    return localStorage.getItem(REMINDER_KEY) === '1';
  } catch {
    return false;
  }
}

export function setRemindersEnabled(on: boolean): void {
  try {
    localStorage.setItem(REMINDER_KEY, on ? '1' : '0');
  } catch {
    /* noop */
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return Notification.requestPermission();
}

/** Programa un recordatorio local vía Service Worker si está disponible. */
export async function scheduleDailyReminder(): Promise<void> {
  if (!areRemindersEnabled()) return;
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready.catch(() => null);
  if (!reg || !('showNotification' in reg)) return;

  const now = new Date();
  const next = new Date(now);
  next.setHours(REMINDER_HOUR, 0, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1);
  const delay = next.getTime() - now.getTime();

  setTimeout(() => {
    void reg.showNotification('PulsePath', {
      body: 'Tu check-in diario te espera (~2 min).',
      icon: '/pulsepath/icons/icon.svg',
      tag: 'pulsepath-daily',
    });
  }, delay);
}
