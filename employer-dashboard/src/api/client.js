const TOKEN_KEY = 'pulsepath_employer_token';

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem('pulsepath_org_id');
  sessionStorage.removeItem('pulsepath_role');
}

export function setSession({ token, orgId, role }) {
  setToken(token);
  if (orgId) sessionStorage.setItem('pulsepath_org_id', orgId);
  if (role) sessionStorage.setItem('pulsepath_role', role);
}

export function getOrgId() {
  return sessionStorage.getItem('pulsepath_org_id');
}

export function getRole() {
  return sessionStorage.getItem('pulsepath_role');
}

export function isAuthenticated() {
  return Boolean(getToken());
}

/**
 * Fetch wrapper con JWT de empleador desde sessionStorage.
 * @param {string} path - Ruta relativa (ej. /api/v1/dashboard/uuid)
 * @param {RequestInit} [options]
 */
export async function apiFetch(path, options = {}) {
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(path, { ...options, headers });

  if (response.status === 401) {
    clearToken();
    window.location.reload();
    throw new Error('Sesión expirada. Vuelve a iniciar sesión.');
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json().catch(() => null) : await response.text();

  if (!response.ok) {
    const message =
      (data && typeof data === 'object' && data.message) ||
      (typeof data === 'string' && data) ||
      `Error ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}
