/**
 * PulsePath — Cifrado local de datos sensibles en el dispositivo (Edge).
 *
 * Web Crypto API nativa (sin librerías externas). Compatible con Safari iOS 16.4+.
 *
 * Modelo de claves:
 *   - Se genera "material de clave" aleatorio (32 bytes) en el primer uso y se
 *     guarda en `db config` bajo 'crypto_keymaterial'.
 *   - Se genera un `salt` aleatorio (16 bytes) por dispositivo y se guarda en
 *     'crypto_salt'.
 *   - Con PBKDF2 (100.000 iteraciones, SHA-256) se deriva una clave AES-256-GCM.
 *   - La clave derivada (CryptoKey, no extraíble) SOLO vive en memoria de módulo,
 *     nunca se persiste en claro.
 *
 * Formato de cifrado: AES-256-GCM. El tag de autenticación (128 bits) se separa
 * del ciphertext y se devuelve aparte; todo en base64.
 *
 * Errores: si el descifrado falla (clave incorrecta, datos corruptos), se
 * devuelve `null` en lugar de lanzar (defensivo para RGPD/portabilidad).
 */

import { getConfig, setConfig } from '../storage/db.js';

const SALT_KEY = 'crypto_salt';
const KEY_MATERIAL_KEY = 'crypto_keymaterial';
const TOKEN_KEY = 'encrypted_token';

const PBKDF2_ITERATIONS = 100000;
const PBKDF2_HASH = 'SHA-256';
const SALT_BYTES = 16;
const KEY_MATERIAL_BYTES = 32;
const AES_KEY_BITS = 256;
const IV_BYTES = 12; // 96 bits, recomendado para AES-GCM
const TAG_BYTES = 16; // 128 bits

const EXPORT_FORMAT = 'pulsepath-encrypted-history-v1';

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * Clave AES derivada. Solo vive aquí, en memoria. Nunca se persiste en claro.
 * @type {CryptoKey|null}
 */
let derivedKey = null;

/**
 * Promesa de inicialización en curso (para idempotencia y evitar carreras).
 * @type {Promise<void>|null}
 */
let initPromise = null;

// ─── Utilidades base64 ⇄ bytes ────────────────────────────────────────────────

/**
 * @param {Uint8Array} bytes
 * @returns {string} base64
 */
function bytesToBase64(bytes) {
  let binary = '';
  const chunkSize = 0x8000; // evita desbordar la pila con arrays grandes
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

/**
 * @param {string} base64
 * @returns {Uint8Array}
 */
function base64ToBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function getSubtle() {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }
  return crypto.subtle;
}

// ─── Inicialización y derivación de clave ─────────────────────────────────────

async function loadOrCreateBytes(configKey, byteLength) {
  const existing = await getConfig(configKey);
  if (typeof existing === 'string' && existing.length > 0) {
    return base64ToBytes(existing);
  }
  const fresh = crypto.getRandomValues(new Uint8Array(byteLength));
  await setConfig(configKey, bytesToBase64(fresh));
  return fresh;
}

async function deriveKey() {
  const subtle = getSubtle();
  const keyMaterialBytes = await loadOrCreateBytes(KEY_MATERIAL_KEY, KEY_MATERIAL_BYTES);
  const saltBytes = await loadOrCreateBytes(SALT_KEY, SALT_BYTES);

  const baseKey = await subtle.importKey(
    'raw',
    keyMaterialBytes,
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_BITS },
    false, // no extraíble: refuerza que la clave no se pueda exportar
    ['encrypt', 'decrypt'],
  );
}

/**
 * Inicializa el salt, el material de clave y la clave AES derivada.
 * Idempotente: si ya está inicializado, no repite trabajo.
 * Guarda el salt en `db config` bajo 'crypto_salt'.
 * @returns {Promise<void>}
 */
export async function initCrypto() {
  if (derivedKey) return;
  if (!initPromise) {
    initPromise = deriveKey()
      .then((key) => {
        derivedKey = key;
      })
      .catch((err) => {
        initPromise = null; // permite reintentar tras un fallo
        throw err;
      });
  }
  await initPromise;
}

async function ensureKey() {
  if (!derivedKey) await initCrypto();
  return derivedKey;
}

// ─── Cifrado / descifrado de strings ──────────────────────────────────────────

/**
 * Cifra un string con AES-256-GCM.
 * @param {string} plaintext
 * @returns {Promise<{ ciphertext: string, iv: string, tag: string }>} todo en base64
 */
export async function encryptString(plaintext) {
  const key = await ensureKey();
  const subtle = getSubtle();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const encrypted = new Uint8Array(
    await subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: TAG_BYTES * 8 },
      key,
      textEncoder.encode(plaintext),
    ),
  );

  // Web Crypto concatena el tag de autenticación al final del ciphertext.
  const cipherBytes = encrypted.subarray(0, encrypted.length - TAG_BYTES);
  const tagBytes = encrypted.subarray(encrypted.length - TAG_BYTES);

  return {
    ciphertext: bytesToBase64(cipherBytes),
    iv: bytesToBase64(iv),
    tag: bytesToBase64(tagBytes),
  };
}

/**
 * Descifra un objeto producido por `encryptString`.
 * @param {{ ciphertext: string, iv: string, tag: string }} payload
 * @returns {Promise<string|null>} el texto plano, o null si falla.
 */
export async function decryptString(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const { ciphertext, iv, tag } = payload;
  if (typeof ciphertext !== 'string' || typeof iv !== 'string' || typeof tag !== 'string') {
    return null;
  }

  try {
    const key = await ensureKey();
    const subtle = getSubtle();
    const combined = concatBytes(base64ToBytes(ciphertext), base64ToBytes(tag));

    const decrypted = await subtle.decrypt(
      { name: 'AES-GCM', iv: base64ToBytes(iv), tagLength: TAG_BYTES * 8 },
      key,
      combined,
    );

    return textDecoder.decode(decrypted);
  } catch {
    return null; // clave incorrecta, datos manipulados o corruptos
  }
}

// ─── Wrappers JSON ────────────────────────────────────────────────────────────

/**
 * Serializa y cifra un objeto JSON.
 * @param {*} obj
 * @returns {Promise<{ ciphertext: string, iv: string, tag: string }>}
 */
export async function encryptJson(obj) {
  return encryptString(JSON.stringify(obj));
}

/**
 * Descifra y parsea un objeto producido por `encryptJson`.
 * @param {{ ciphertext: string, iv: string, tag: string }} encrypted
 * @returns {Promise<*|null>} el objeto, o null si falla el descifrado/parseo.
 */
export async function decryptJson(encrypted) {
  const plaintext = await decryptString(encrypted);
  if (plaintext === null) return null;
  try {
    return JSON.parse(plaintext);
  } catch {
    return null;
  }
}

// ─── Token cifrado en `db config` ─────────────────────────────────────────────

/**
 * Cifra un JWT y lo guarda en `db config` bajo 'encrypted_token'.
 * NUNCA persiste el JWT en claro.
 * @param {string} jwt
 * @returns {Promise<void>}
 */
export async function encryptToken(jwt) {
  const encrypted = await encryptString(jwt);
  await setConfig(TOKEN_KEY, encrypted);
}

/**
 * Lee y descifra el token guardado en 'encrypted_token'.
 * @returns {Promise<string|null>} el JWT, o null si no existe o falla.
 */
export async function decryptToken() {
  const encrypted = await getConfig(TOKEN_KEY);
  if (!encrypted) return null;
  return decryptString(encrypted);
}

// ─── Exportación de historial (portabilidad RGPD) ─────────────────────────────

/**
 * Cifra el historial de sesiones y devuelve un Blob JSON descargable.
 * El payload va cifrado (AES-256-GCM); solo el sobre con metadatos va en claro.
 * @param {object[]} sessions
 * @returns {Promise<Blob>} application/json
 */
export async function exportEncryptedHistory(sessions) {
  const payload = await encryptJson(sessions);

  const envelope = {
    format: EXPORT_FORMAT,
    algorithm: 'AES-256-GCM',
    kdf: { name: 'PBKDF2', iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH },
    exportedAt: new Date().toISOString(),
    payload,
  };

  return new Blob([JSON.stringify(envelope, null, 2)], { type: 'application/json' });
}

// ─── Supresión (derecho al olvido, RGPD) ──────────────────────────────────────

/**
 * Borra el salt, el material de clave, el token cifrado y la clave en memoria.
 * Tras llamarla, el próximo `initCrypto()` genera un salt/clave nuevos.
 * @returns {Promise<void>}
 */
export async function clearCrypto() {
  derivedKey = null;
  initPromise = null;

  // db.js no expone borrado por clave; ponemos null (getConfig devolverá null,
  // por lo que initCrypto regenerará salt y material de clave en el próximo uso).
  await Promise.all([
    setConfig(SALT_KEY, null),
    setConfig(KEY_MATERIAL_KEY, null),
    setConfig(TOKEN_KEY, null),
  ]);
}
