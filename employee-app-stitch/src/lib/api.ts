/**
 * PulsePath — cliente API backend Node (piloto B2B).
 * Si VITE_API_URL no está definido, la app funciona solo en local (IndexedDB).
 */
import { hashAccessCode } from './hash';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const ORG_SLUG = (import.meta.env.VITE_ORG_SLUG as string | undefined) ?? 'bcn';
const POLICY_VERSION = '2026-07-17';
const TOKEN_KEY = 'pulsepath.apiToken';

export function isApiEnabled(): boolean {
  return Boolean(API_BASE);
}

export function getApiToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setApiToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* noop */
  }
}

export function clearApiToken(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* noop */
  }
}

export interface ActivateResult {
  token: string;
  department: string;
  shift: string | null;
}

/** Activa código anónimo en el backend y devuelve JWT. */
export async function activateWithBackend(accessCode: string): Promise<ActivateResult | null> {
  if (!API_BASE) return null;
  const codeHash = await hashAccessCode(accessCode);
  const res = await fetch(`${API_BASE}/auth/anonymous`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      org_slug: ORG_SLUG,
      code_hash: codeHash,
      consent: true,
      policy_version: POLICY_VERSION,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { token: string; department: string; shift: string | null };
  setApiToken(data.token);
  return data;
}

export interface SessionPayload {
  timestamp: string;
  risk_index: number;
  pvt_index: number;
  stroop_index: number;
  cbi_score?: number;
  sleep_hours: number;
}

/** Sube una sesión diaria al backend (mapeo stitch → schema legacy). */
export async function syncSession(payload: SessionPayload): Promise<boolean> {
  const token = getApiToken();
  if (!API_BASE || !token) return false;
  const res = await fetch(`${API_BASE}/session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  return res.ok;
}
