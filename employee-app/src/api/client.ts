import { hashCode } from '../crypto/hash';
import { encryptToken, decryptToken, clearCrypto } from '../crypto/local';

export const TOKEN_KEY = 'pulsepath_token';
export const ORG_SLUG = 'ayuntamiento_bcn';

const META_DEPARTMENT_KEY = 'pulsepath_department';
const META_SHIFT_KEY = 'pulsepath_shift';

const SESSION_ALLOWED_FIELDS = new Set([
  'timestamp',
  'risk_index',
  'pvt_index',
  'stroop_index',
  'cbi_score',
  'sleep_hours',
]);

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data: any) {
    super(message);
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * Lee el JWT descifrado desde `db config`.
 */
export async function getToken(): Promise<string | null> {
  try {
    const token = await decryptToken();
    if (token) return token;
  } catch {
    // crypto.subtle no disponible (HTTP sin HTTPS) — ignorar
  }

  const legacy = localStorage.getItem(TOKEN_KEY);
  if (legacy) {
    try {
      await encryptToken(legacy);
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // Si crypto falla, dejar en localStorage
    }
    return legacy;
  }

  return null;
}

/**
 * Cifra y persiste el JWT en `db config`.
 */
export async function setToken(token: string): Promise<void> {
  await encryptToken(token);
}

/**
 * Elimina el token cifrado y las claves criptográficas del dispositivo.
 */
export async function clearToken(): Promise<void> {
  await clearCrypto();
  localStorage.removeItem(META_DEPARTMENT_KEY);
  localStorage.removeItem(META_SHIFT_KEY);
}

export interface SessionMeta {
  department?: string;
  shift?: string;
}

/**
 * Obtiene metadatos de sesión.
 */
export function getSessionMeta(): SessionMeta {
  const department = localStorage.getItem(META_DEPARTMENT_KEY);
  const shift = localStorage.getItem(META_SHIFT_KEY);
  const meta: SessionMeta = {};

  if (department) meta.department = department;
  if (shift) meta.shift = shift;

  return meta;
}

/**
 * Guarda metadatos de sesión.
 */
export function setSessionMeta({ department, shift }: SessionMeta): void {
  if (department) {
    localStorage.setItem(META_DEPARTMENT_KEY, department);
  } else {
    localStorage.removeItem(META_DEPARTMENT_KEY);
  }

  if (shift) {
    localStorage.setItem(META_SHIFT_KEY, shift);
  } else {
    localStorage.removeItem(META_SHIFT_KEY);
  }
}

function resolveApiPath(path: string): string {
  if (path.startsWith('/api/')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/api/v1${normalized}`;
}

function parseErrorMessage(data: any, status: number): string {
  if (data && typeof data === 'object') {
    if (typeof data.error === 'string') return data.error;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.fields) && data.fields.length > 0) {
      return `Campos no permitidos: ${data.fields.join(', ')}`;
    }
  }
  if (typeof data === 'string' && data.trim()) return data;
  return `Error ${status}`;
}

/**
 * Realiza fetch a la API.
 */
export async function apiFetch(path: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = await getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveApiPath(path), { ...options, headers });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message = parseErrorMessage(data, response.status);
    throw new ApiError(message, response.status, data);
  }

  return data;
}

/**
 * Activa un código anónimo.
 */
export async function activateAnonymous(
  codePlain: string,
  consent: boolean,
  policyVersion: string
): Promise<any> {
  const code_hash = await hashCode(codePlain);

  const data = await apiFetch('/auth/anonymous', {
    method: 'POST',
    body: JSON.stringify({
      org_slug: ORG_SLUG,
      code_hash,
      consent,
      policy_version: policyVersion,
    }),
  });

  await setToken(data.token);
  setSessionMeta({
    department: data.department,
    shift: data.shift,
  });

  return data;
}

function assertSessionPayload(payload: any): void {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('El payload de sesión debe ser un objeto.');
  }

  const extraFields = Object.keys(payload).filter((key) => !SESSION_ALLOWED_FIELDS.has(key));
  if (extraFields.length > 0) {
    throw new Error(
      `Privacidad: el payload contiene campos no permitidos (${extraFields.join(', ')}). ` +
        'Solo se pueden enviar: timestamp, risk_index, pvt_index, stroop_index, cbi_score, sleep_hours.'
    );
  }
}

/**
 * Envía el resultado del test al servidor.
 */
export async function submitSession(payload: any): Promise<any> {
  assertSessionPayload(payload);

  return apiFetch('/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
