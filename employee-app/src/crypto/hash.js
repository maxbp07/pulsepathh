/**
 * SHA-256 del código anónimo en hex (UTF-8).
 * El código en claro NUNCA se envía al servidor — solo el hash.
 * @param {string} plainCode
 * @returns {Promise<string>}
 */
export async function hashCode(plainCode) {
  const encoded = new TextEncoder().encode(plainCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
