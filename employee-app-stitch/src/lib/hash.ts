/** SHA-256 del código de acceso en hex (UTF-8). Compatible con backend Node. */
export async function hashAccessCode(plainCode: string): Promise<string> {
  const encoded = new TextEncoder().encode(plainCode.trim().toUpperCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
