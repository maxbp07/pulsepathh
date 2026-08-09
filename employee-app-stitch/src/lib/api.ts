/**
 * PulsePath — cliente API backend Node (piloto estudio ML).
 */
import { hashAccessCode } from './hash';
import { CONSENT_VERSION } from './prefs';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? '';
const ORG_SLUG = (import.meta.env.VITE_ORG_SLUG as string | undefined) ?? 'study_mixed_2026';
const TOKEN_KEY = 'pulsepath.apiToken';

export { CONSENT_VERSION };

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
  department: string | null;
  shift: string | null;
  studyDay0: string | null;
}

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
      policy_version: CONSENT_VERSION,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    token: string;
    department: string | null;
    shift: string | null;
    study_day0?: string | null;
  };
  setApiToken(data.token);
  return {
    token: data.token,
    department: data.department,
    shift: data.shift,
    studyDay0: data.study_day0 ?? null,
  };
}

export interface DailyCheckinPayload {
  client_record_id: string;
  date_local: string;
  tz: string;
  timestamp: string;
  kss: number;
  context: { sleepHours: number; quality: number; coffee: boolean };
  pvt: Record<string, unknown>;
  derived?: { fri: number; vitality: number };
  app_version?: string;
}

export type SyncResult = 'stored' | 'duplicate' | 'conflict' | 'ineligible' | 'failed';

export async function syncDailyCheckin(payload: DailyCheckinPayload): Promise<SyncResult> {
  const token = getApiToken();
  if (!API_BASE || !token) return 'failed';
  const res = await fetch(`${API_BASE}/checkins/daily`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 201) return 'stored';
  if (res.status === 200) return 'duplicate';
  if (res.status === 409) return 'conflict';
  if (res.status === 422) return 'ineligible';
  return 'failed';
}

export interface QuestionnairePayload {
  client_record_id: string;
  instrument: 'DASS21_STRESS' | 'DASS21_FULL' | 'GAD7' | 'CBI';
  timepoint: 'D0' | 'D7' | 'D14';
  timestamp: string;
  items: Array<{ id: string; value: number | string }>;
  app_version?: string;
}

export async function syncQuestionnaire(payload: QuestionnairePayload): Promise<SyncResult> {
  const token = getApiToken();
  if (!API_BASE || !token) return 'failed';
  const res = await fetch(`${API_BASE}/checkins/questionnaire`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (res.status === 201) return 'stored';
  if (res.status === 200) return 'duplicate';
  if (res.status === 409) return 'conflict';
  if (res.status === 422) return 'ineligible';
  return 'failed';
}

export async function registerPushSubscription(subscription: PushSubscriptionJSON): Promise<boolean> {
  const token = getApiToken();
  if (!API_BASE || !token || !subscription.endpoint) return false;
  const res = await fetch(`${API_BASE}/me/push-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: subscription.keys,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
  return res.ok;
}

export async function unregisterPushSubscription(endpoint: string): Promise<boolean> {
  const token = getApiToken();
  if (!API_BASE || !token) return false;
  const res = await fetch(`${API_BASE}/me/push-subscription`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ endpoint }),
  });
  return res.ok;
}

export async function fetchVapidPublicKey(): Promise<string | null> {
  if (!API_BASE) return null;
  const res = await fetch(`${API_BASE}/push/vapid-public-key`);
  if (!res.ok) return null;
  const data = (await res.json()) as { publicKey?: string };
  return data.publicKey ?? null;
}

export async function deleteRemoteData(): Promise<boolean> {
  const token = getApiToken();
  if (!API_BASE || !token) return true;
  const res = await fetch(`${API_BASE}/me/delete`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.ok;
}

/** @deprecated legacy scalar session endpoint */
export interface SessionPayload {
  timestamp: string;
  risk_index: number;
  pvt_index: number;
  stroop_index: number;
  cbi_score?: number;
  sleep_hours: number;
}

/** @deprecated */
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
