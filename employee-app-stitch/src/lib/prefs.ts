/**
 * PulsePath — synchronous local prefs (auth, onboarding, language, consent).
 *
 * Kept in localStorage (not IndexedDB) so routing guards can read them
 * synchronously on first render without an async flicker. All access is guarded
 * with try/catch: private-mode / disabled storage degrades gracefully instead of
 * crashing (relevant for the mobile HTTP white-screen class of bugs).
 */
export type Lang = 'en' | 'es' | 'ca';

/** Version sent to backend as policy_version and stored locally with acceptance. */
export const CONSENT_VERSION = '1.0';

const K_CODE = 'pulsepath.accessCode';
const K_ONBOARDED = 'pulsepath.onboarded';
const K_LANG = 'pulsepath.lang';
const K_CONSENT = 'pulsepath.consentVersion';
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

/**
 * Canonical pilot format: PP-YYYY-NNN (e.g. PP-2026-001).
 * Matches backend/scripts/provision-codes.js and seed-study.js.
 */
export function isValidAccessCode(code: string): boolean {
  const c = code.trim().toUpperCase();
  return /^PP-\d{4}-\d{3}$/.test(c);
}

// ─── Onboarding (once per device) ────────────────────────────────────────────

export function isOnboarded(): boolean {
  return read(K_ONBOARDED) === '1' && hasConsent();
}

export function setOnboarded(): void {
  write(K_ONBOARDED, '1');
}

export function clearOnboarded(): void {
  remove(K_ONBOARDED);
  clearConsent();
}

// ─── Consent (versioned; required before study data collection) ──────────────

export function hasConsent(): boolean {
  return read(K_CONSENT) === CONSENT_VERSION;
}

export function acceptConsent(): void {
  write(K_CONSENT, CONSENT_VERSION);
}

export function clearConsent(): void {
  remove(K_CONSENT);
}

const K_REMINDERS = 'pulsepath.remindersEnabled';

export function clearRemindersEnabled(): void {
  remove(K_REMINDERS);
}

// ─── Language ────────────────────────────────────────────────────────────────

export function getLang(): Lang {
  const stored = read(K_LANG);
  if (stored === 'en' || stored === 'es' || stored === 'ca') return stored;
  // Default español para pilotos en España (decisión roadmap 17 jul 2026)
  return 'es';
}

export function setLang(lang: Lang): void {
  write(K_LANG, lang);
}
