/**
 * PulsePath — Cifrado local de datos sensibles en el dispositivo (Edge).
 */

import { getConfig, setConfig } from '../storage/db';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  tag: string;
}

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

let derivedKey: CryptoKey | null = null;
let initPromise: Promise<void> | null = null;

function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function concatBytes(a: Uint8Array, b: Uint8Array): Uint8Array {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0);
  out.set(b, a.length);
  return out;
}

function getSubtle(): SubtleCrypto {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto API no disponible en este entorno.');
  }
  return crypto.subtle;
}

async function loadOrCreateBytes(configKey: string, byteLength: number): Promise<Uint8Array> {
  const existing = await getConfig<string>(configKey);
  if (typeof existing === 'string' && existing.length > 0) {
    return base64ToBytes(existing);
  }
  const fresh = crypto.getRandomValues(new Uint8Array(byteLength));
  await setConfig(configKey, bytesToBase64(fresh));
  return fresh;
}

async function deriveKey(): Promise<CryptoKey> {
  const subtle = getSubtle();
  const keyMaterialBytes = await loadOrCreateBytes(KEY_MATERIAL_KEY, KEY_MATERIAL_BYTES);
  const saltBytes = await loadOrCreateBytes(SALT_KEY, SALT_BYTES);

  const baseKey = await subtle.importKey(
    'raw',
    keyMaterialBytes as any,
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBytes as any,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: 'AES-GCM', length: AES_KEY_BITS },
    false, // no extraíble
    ['encrypt', 'decrypt']
  );
}

/**
 * Inicializa la clave AES derivada.
 */
export async function initCrypto(): Promise<void> {
  if (derivedKey) return;
  if (!initPromise) {
    initPromise = deriveKey()
      .then((key) => {
        derivedKey = key;
      })
      .catch((err) => {
        initPromise = null;
        throw err;
      });
  }
  await initPromise;
}

async function ensureKey(): Promise<CryptoKey> {
  if (!derivedKey) await initCrypto();
  return derivedKey!;
}

/**
 * Cifra un string con AES-256-GCM.
 */
export async function encryptString(plaintext: string): Promise<EncryptedPayload> {
  const key = await ensureKey();
  const subtle = getSubtle();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const encrypted = new Uint8Array(
    await subtle.encrypt(
      { name: 'AES-GCM', iv: iv as any, tagLength: TAG_BYTES * 8 },
      key,
      textEncoder.encode(plaintext)
    )
  );

  const cipherBytes = encrypted.subarray(0, encrypted.length - TAG_BYTES);
  const tagBytes = encrypted.subarray(encrypted.length - TAG_BYTES);

  return {
    ciphertext: bytesToBase64(cipherBytes),
    iv: bytesToBase64(iv),
    tag: bytesToBase64(tagBytes),
  };
}

/**
 * Descifra un objeto cifrado.
 */
export async function decryptString(payload: EncryptedPayload | null): Promise<string | null> {
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
      { name: 'AES-GCM', iv: base64ToBytes(iv) as any, tagLength: TAG_BYTES * 8 },
      key,
      combined as any
    );

    return textDecoder.decode(decrypted);
  } catch {
    return null;
  }
}

/**
 * Serializa y cifra un objeto JSON.
 */
export async function encryptJson<T>(obj: T): Promise<EncryptedPayload> {
  return encryptString(JSON.stringify(obj));
}

/**
 * Descifra y parsea un objeto JSON cifrado.
 */
export async function decryptJson<T>(encrypted: EncryptedPayload | null): Promise<T | null> {
  const plaintext = await decryptString(encrypted);
  if (plaintext === null) return null;
  try {
    return JSON.parse(plaintext) as T;
  } catch {
    return null;
  }
}

/**
 * Cifra un JWT y lo guarda.
 */
export async function encryptToken(jwt: string): Promise<void> {
  const encrypted = await encryptString(jwt);
  await setConfig(TOKEN_KEY, encrypted);
}

/**
 * Lee y descifra el token.
 */
export async function decryptToken(): Promise<string | null> {
  const encrypted = await getConfig<EncryptedPayload>(TOKEN_KEY);
  if (!encrypted) return null;
  return decryptString(encrypted);
}

/**
 * Cifra el historial de sesiones y devuelve un Blob JSON descargable.
 */
export async function exportEncryptedHistory(sessions: any[]): Promise<Blob> {
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

/**
 * Borra el salt, material de clave y token de la configuración.
 */
export async function clearCrypto(): Promise<void> {
  derivedKey = null;
  initPromise = null;

  await Promise.all([
    setConfig(SALT_KEY, null),
    setConfig(KEY_MATERIAL_KEY, null),
    setConfig(TOKEN_KEY, null),
  ]);
}
