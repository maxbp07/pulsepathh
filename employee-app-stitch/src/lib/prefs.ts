/**
 * PulsePath — synchronous local prefs (auth, onboarding, language).
 *
 * Kept in localStorage (not IndexedDB) so routing guards can read them
 * synchronously on first render without an async flicker. All access is guarded
 * with try/catch: private-mode / disabled storage degrades gracefully instead of
 * crashing (relevant for the mobile HTTP white-screen class of bugs).
 */
export type Lang = 'en' | 'es';

const K_CODE = 'pulsepath.accessCode';
const K_ONBOARDED = 'pulsepath.onboarded';
const K_LANG = 'pulsepath.lang';
/** Legacy key still read by getOrCreateParticipantId(); kept in sync. */
const K_PARTICIPANT = 'pulsepath.participantId';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
function write(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* noop */
  }
}
function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* noop */
  }
}

// ─── Access code = participant identity ──────────────────────────────────────

export function getAccessCode(): string | null {
  return read(K_CODE);
}

export function setAccessCode(code: string): void {
  write(K_CODE, code);
  // Keep the legacy participantId in sync so existing data and code paths that
  // read it resolve to the same identity as the entered access code.
  write(K_PARTICIPANT, code);
}

export function clearAccessCode(): void {
  remove(K_CODE);
  remove(K_PARTICIPANT);
}

/** Validates the access-code format: 3 letters, dash, 3 digits (e.g. BCN-492). */
export function isValidAccessCode(code: string): boolean {
  return /^[A-Z]{3}-\d{3}$/.test(code.trim().toUpperCase());
}

// ─── Onboarding (once per device) ────────────────────────────────────────────

export function isOnboarded(): boolean {
  return read(K_ONBOARDED) === '1';
}

export function setOnboarded(): void {
  write(K_ONBOARDED, '1');
}

// ─── Language ────────────────────────────────────────────────────────────────

export function getLang(): Lang {
  const stored = read(K_LANG);
  if (stored === 'en' || stored === 'es') return stored;
  // Default español para pilotos en España (decisión roadmap 17 jul 2026)
  return 'es';
}

export function setLang(lang: Lang): void {
  write(K_LANG, lang);
}
