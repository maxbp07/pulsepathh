/**
 * PulsePath — Service Worker registration (crash-safe).
 *
 * vite-plugin-pwa (registerType: 'autoUpdate') generates the SW; we register it
 * here with full guards so it can NEVER throw on the insecure (HTTP) origin that
 * mobile browsers reject. Service workers require a secure context (HTTPS or
 * localhost); on plain HTTP the registration is rejected by the
 * browser and we swallow it. The durable fix is HTTPS — see deploy notes.
 */
import { registerSW } from 'virtual:pwa-register';

export function registerPwa(): void {
  if (typeof window === 'undefined') return;
  // Service workers require a secure context (HTTPS or localhost). On the
  // plain-HTTP VPS the browser would reject registration, so we bail out early
  // instead of even attempting (avoids any chance of a throw). Auto-enables on
  // HTTPS. Durable fix for full PWA install/offline = serve over HTTPS.
  if (!('isSecureContext' in window) || !window.isSecureContext) return;
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  // Only register production builds; dev is served by Vite directly.
  if (!import.meta.env.PROD) return;
  if (typeof registerSW !== 'function') return;

  try {
    registerSW({
      immediate: true,
      onRegistered: () => undefined,
      onRegisterError: () => undefined,
    });
  } catch {
    /* Insecure origin (HTTP) → registration rejected; safe to ignore. */
  }
}
