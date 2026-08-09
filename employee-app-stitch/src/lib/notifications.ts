/**
 * PulsePath — Web Push VAPID + permisos de notificación.
 */
import {
  fetchVapidPublicKey,
  isApiEnabled,
  registerPushSubscription,
  unregisterPushSubscription,
} from './api';

const REMINDER_KEY = 'pulsepath.remindersEnabled';
const PUSH_ENDPOINT_KEY = 'pulsepath.pushEndpoint';

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

function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
  return out;
}

export async function subscribeToPush(): Promise<boolean> {
  if (!isApiEnabled()) return false;
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;

  const perm = await requestNotificationPermission();
  if (perm !== 'granted') return false;

  const vapid = await fetchVapidPublicKey();
  if (!vapid) return false;

  const reg = await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapid) as BufferSource,
    });
  }

  const json = sub.toJSON();
  const ok = await registerPushSubscription(json);
  if (ok && json.endpoint) {
    try {
      localStorage.setItem(PUSH_ENDPOINT_KEY, json.endpoint);
    } catch {
      /* noop */
    }
  }
  return ok;
}

export async function unsubscribeFromPush(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  const reg = await navigator.serviceWorker.ready;
  const sub = await reg.pushManager.getSubscription();
  if (sub) {
    const endpoint = sub.endpoint;
    await unregisterPushSubscription(endpoint);
    await sub.unsubscribe();
    try {
      localStorage.removeItem(PUSH_ENDPOINT_KEY);
    } catch {
      /* noop */
    }
  }
}

/** @deprecated use subscribeToPush */
export async function scheduleDailyReminder(): Promise<void> {
  if (areRemindersEnabled()) await subscribeToPush();
}
