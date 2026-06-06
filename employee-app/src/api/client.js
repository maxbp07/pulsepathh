import { hashCode } from '../crypto/hash.js';
import { encryptToken, decryptToken, clearCrypto } from '../crypto/local.js';

// TOKEN_KEY se mantiene exportado para detectar tokens legacy en localStorage.
// El JWT NUNCA se guarda en claro: solo se usa para la migración y como referencia.
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

/**
 * Lee el JWT descifrado desde `db config`.
 * Incluye migración automática: si encuentra un token en claro en localStorage
 * (instalaciones anteriores), lo cifra, borra la entrada plaintext y continúa.
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  const token = await decryptToken();
  if (token) return token;

  // Migración: token legacy en localStorage plano → cifrar y eliminar.
  const legacy = localStorage.getItem(TOKEN_KEY);
  if (legacy) {
    await encryptToken(legacy);
    localStorage.removeItem(TOKEN_KEY);
    return legacy;
  }

  return null;
}

/**
 * Cifra y persiste el JWT en `db config`. Nunca toca localStorage en claro.
 * @param {string} token
 * @returns {Promise<void>}
 */
export async function setToken(token) {
  await encryptToken(token);
}

/**
 * Elimina el token cifrado y las claves criptográficas del dispositivo.
 * También limpia metadatos de sesión en localStorage.
 * @returns {Promise<void>}
 */
export async function clearToken() {
  await clearCrypto();
  localStorage.removeItem(META_DEPARTMENT_KEY);
  localStorage.removeItem(META_SHIFT_KEY);
}

/**
 * @returns {{ department?: string, shift?: string }}
 */
export function getSessionMeta() {
  const department = localStorage.getItem(META_DEPARTMENT_KEY);
  const shift = localStorage.getItem(META_SHIFT_KEY);
  const meta = {};

  if (department) meta.department = department;
  if (shift) meta.shift = shift;

  return meta;
}

/**
 * @param {{ department?: string, shift?: string }} meta
 */
export function setSessionMeta({ department, shift }) {
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

function resolveApiPath(path) {
  if (path.startsWith('/api/')) {
    return path;
  }
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `/api/v1${normalized}`;
}

function parseErrorMessage(data, status) {
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
 * @param {string} path - Ruta bajo /api/v1 (ej. /auth/anonymous o /api/v1/session)
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
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
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

/**
 * Activa un código anónimo. El código en claro se hashea en el dispositivo.
 * El JWT devuelto se guarda cifrado; nunca se escribe en localStorage en claro.
 * @param {string} codePlain
 * @param {boolean} consent
 * @param {string} policyVersion
 */
export async function activateAnonymous(codePlain, consent, policyVersion) {
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

function assertSessionPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('El payload de sesión debe ser un objeto.');
  }

  const extraFields = Object.keys(payload).filter((key) => !SESSION_ALLOWED_FIELDS.has(key));
  if (extraFields.length > 0) {
    throw new Error(
      `Privacidad: el payload contiene campos no permitidos (${extraFields.join(', ')}). ` +
        'Solo se pueden enviar: timestamp, risk_index, pvt_index, stroop_index, cbi_score, sleep_hours.',
    );
  }
}

/**
 * Envía el resultado del test al servidor (solo índices agregados).
 * @param {Record<string, unknown>} payload
 */
export async function submitSession(payload) {
  assertSessionPayload(payload);

  return apiFetch('/session', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
