import type { DashboardData, LoginResponse } from './types';

// Cliente API del empleador. Mantiene el contrato y las claves de sessionStorage
// del dashboard original (src/api/client.js) para no romper nada existente.

const TOKEN_KEY = 'pulsepath_employer_token';
const ORG_KEY = 'pulsepath_org_id';
const ROLE_KEY = 'pulsepath_role';

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}
export function getOrgId(): string | null {
  return sessionStorage.getItem(ORG_KEY);
}
export function getRole(): string | null {
  return sessionStorage.getItem(ROLE_KEY);
}
export function isAuthenticated(): boolean {
  return Boolean(getToken());
}
export function setSession(s: LoginResponse): void {
  sessionStorage.setItem(TOKEN_KEY, s.token);
  if (s.orgId) sessionStorage.setItem(ORG_KEY, s.orgId);
  if (s.role) sessionStorage.setItem(ROLE_KEY, s.role);
}
export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(ORG_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      (data && (data.message || data.error)) || `Error ${res.status}`,
      res.status,
    );
  }
  return {
    token: data.token,
    orgId: data.orgId ?? data.org_id ?? data.organizationId,
    role: data.role,
  };
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const token = getToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401) {
    clearSession();
    throw new ApiError('Sesión expirada. Vuelve a iniciar sesión.', 401);
  }

  const isJson = (res.headers.get('content-type') || '').includes('application/json');
  const data = isJson ? await res.json().catch(() => null) : await res.text();

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && (data.message || data.error)) ||
      (typeof data === 'string' && data) ||
      `Error ${res.status}`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

export interface DashboardFilters {
  department?: string;
  shift?: string;
  from?: string;
  to?: string;
}

export function buildDashboardUrl(orgId: string, filters: DashboardFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.department) params.set('department', filters.department);
  if (filters.shift) params.set('shift', filters.shift);
  if (filters.from) params.set('from', filters.from);
  if (filters.to) params.set('to', filters.to);
  const qs = params.toString();
  return `/api/v1/dashboard/${orgId}${qs ? `?${qs}` : ''}`;
}

export async function fetchDashboard(
  orgId: string,
  filters: DashboardFilters = {},
): Promise<DashboardData> {
  return apiFetch<DashboardData>(buildDashboardUrl(orgId, filters));
}

const ADMIN_SECRET_KEY = 'pulsepath_admin_secret';

export function getAdminSecret(): string | null {
  return sessionStorage.getItem(ADMIN_SECRET_KEY);
}

export function setAdminSecret(secret: string): void {
  sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
}

export async function fetchAdherence(
  orgId: string,
  adminSecret: string,
  asOf?: string,
): Promise<import('./opsTypes').AdherenceResponse> {
  const qs = asOf ? `?as_of=${encodeURIComponent(asOf)}` : '';
  const res = await fetch(`/api/v1/ops/${orgId}/adherence${qs}`, {
    headers: { 'X-Admin-Secret': adminSecret },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((data && data.error) || `Error ${res.status}`, res.status);
  }
  return data;
}

export async function fetchAdherenceSummary(
  orgId: string,
  adminSecret: string,
  asOf?: string,
): Promise<import('./opsTypes').AdherenceSummary> {
  const qs = asOf ? `?as_of=${encodeURIComponent(asOf)}` : '';
  const res = await fetch(`/api/v1/ops/${orgId}/adherence/summary${qs}`, {
    headers: { 'X-Admin-Secret': adminSecret },
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError((data && data.error) || `Error ${res.status}`, res.status);
  }
  return data;
}
