/**
 * SHA-256 del código anónimo en hex (UTF-8).
 */
export async function hashCode(plainCode: string): Promise<string> {
  const encoded = new TextEncoder().encode(plainCode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
