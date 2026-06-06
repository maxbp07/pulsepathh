import crypto from 'node:crypto';
import { config } from '../config/env.js';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce, recommended size for GCM
const AUTH_TAG_LENGTH = 16; // 128-bit authentication tag
const KEY_LENGTH = 32; // AES-256 requires a 32-byte key

/**
 * Normalises the configured encryption key to exactly 32 bytes.
 *
 * Accepts either:
 *   - a 64-character hex string (decoded to 32 raw bytes), or
 *   - any other UTF-8 string / value, which is hashed with SHA-256 to
 *     deterministically derive 32 bytes.
 *
 * Resolved once at module load so the key never needs to be re-read or logged.
 *
 * @param {string} rawKey
 * @returns {Buffer} 32-byte key
 */
function deriveKey(rawKey) {
  if (typeof rawKey !== 'string' || rawKey.length === 0) {
    throw new Error('crypto: encryptionKey is missing or not a string.');
  }

  // A 64-char hex string decodes to exactly 32 bytes: use it verbatim.
  if (rawKey.length === 64 && /^[0-9a-fA-F]+$/.test(rawKey)) {
    return Buffer.from(rawKey, 'hex');
  }

  // If the raw UTF-8 bytes already measure exactly 32 bytes, use them directly.
  const asUtf8 = Buffer.from(rawKey, 'utf8');
  if (asUtf8.length === KEY_LENGTH) {
    return asUtf8;
  }

  // Otherwise derive a stable 32-byte key via SHA-256.
  return crypto.createHash('sha256').update(asUtf8).digest();
}

const KEY = deriveKey(config.encryptionKey);

if (KEY.length !== KEY_LENGTH) {
  throw new Error(`crypto: derived key must be ${KEY_LENGTH} bytes, got ${KEY.length}.`);
}

/**
 * Encrypts a UTF-8 string with AES-256-GCM.
 *
 * Buffer layout: IV (12 bytes) + authTag (16 bytes) + ciphertext.
 * A fresh random IV is generated on every call (IVs are never reused).
 *
 * @param {string} value
 * @returns {Buffer} Buffer ready to persist as Prisma Bytes / BYTEA.
 */
export function encryptString(value) {
  if (typeof value !== 'string') {
    throw new TypeError('encryptString: value must be a string.');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([iv, authTag, ciphertext]);
}

/**
 * Decrypts a buffer produced by {@link encryptString}.
 *
 * @param {Buffer} buffer IV (12) + authTag (16) + ciphertext
 * @returns {string} The original UTF-8 string.
 * @throws {Error} If the buffer is malformed or authentication fails.
 */
export function decryptString(buffer) {
  // Prisma 6 returns Bytes columns as Uint8Array (not Buffer). Accept any
  // Uint8Array-like value and normalise it to a Buffer without copying data.
  if (!Buffer.isBuffer(buffer)) {
    if (buffer instanceof Uint8Array) {
      buffer = Buffer.from(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    } else {
      throw new TypeError('decryptString: argument must be a Buffer or Uint8Array.');
    }
  }

  if (buffer.length < IV_LENGTH + AUTH_TAG_LENGTH) {
    throw new Error('decryptString: buffer is too short to contain IV and auth tag.');
  }

  const iv = buffer.subarray(0, IV_LENGTH);
  const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = buffer.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });
  decipher.setAuthTag(authTag);

  try {
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return plaintext.toString('utf8');
  } catch {
    // Avoid leaking ciphertext/key details: surface a generic, clear error.
    throw new Error('decryptString: decryption failed (invalid data or authentication tag).');
  }
}

/**
 * Encrypts a number (e.g. a risk index) by serialising it as JSON first.
 *
 * @param {number} value A finite number.
 * @returns {Buffer} Buffer ready to persist as Prisma Bytes / BYTEA.
 */
export function encryptNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError('encryptNumber: value must be a finite number.');
  }

  return encryptString(JSON.stringify(value));
}

/**
 * Decrypts a buffer produced by {@link encryptNumber}.
 *
 * @param {Buffer} buffer IV (12) + authTag (16) + ciphertext
 * @returns {number} The original number.
 * @throws {Error} If the buffer is invalid, authentication fails, or the
 *   decrypted payload is not a finite number.
 */
export function decryptNumber(buffer) {
  const decrypted = decryptString(buffer);

  let parsed;
  try {
    parsed = JSON.parse(decrypted);
  } catch {
    throw new Error('decryptNumber: decrypted payload is not valid JSON.');
  }

  if (typeof parsed !== 'number' || !Number.isFinite(parsed)) {
    throw new Error('decryptNumber: decrypted payload is not a finite number.');
  }

  return parsed;
}
