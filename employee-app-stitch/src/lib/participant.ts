/**
 * Identity pseudonym for tagging sessions.
 *
 * Per the product decision, the access code entered at /login (e.g. "BCN-492")
 * IS the participant identity. So this returns the stored access code first; it
 * only falls back to a local UUID for any codeless/legacy state. Either way it
 * is a pseudonym — no name, email or IP is stored.
 */
import { getAccessCode } from './prefs';

const KEY = 'pulsepath.participantId';

function uuidv4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback RFC4122-v4 con Math.random (entorns sense crypto.randomUUID).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getOrCreateParticipantId(): string {
  const code = getAccessCode();
  if (code) return code;

  try {
    const existing = localStorage.getItem(KEY);
    if (existing) return existing;
    const id = uuidv4();
    localStorage.setItem(KEY, id);
    return id;
  } catch {
    return uuidv4(); // efímero si localStorage no disponible
  }
}
