import { useEffect, useState } from 'react';
import type { DashboardData } from '@/lib/types';
import { fetchDashboard, getOrgId, type DashboardFilters } from '@/lib/api';
import { generateDemoDashboard } from '@/lib/mockData';

export type DataMode = 'demo' | 'live';

const MODE_KEY = 'pulsepath_data_mode';

export function getDataMode(): DataMode {
  const m = sessionStorage.getItem(MODE_KEY);
  return m === 'live' ? 'live' : 'demo';
}
export function setDataMode(m: DataMode) {
  sessionStorage.setItem(MODE_KEY, m);
}

interface State {
  data: DashboardData | null;
  loading: boolean;
  error: string | null;
}

/**
 * Carga los datos del dashboard.
 * - modo 'demo': genera datos sintéticos realistas en el cliente (seed del
 *   piloto Barcelona) — funciona sin backend, ideal para demos.
 * - modo 'live': consulta la API real (GET /api/v1/dashboard/:orgId) con JWT.
 */
export function useDashboardData(filters: DashboardFilters, mode: DataMode) {
  const [state, setState] = useState<State>({ data: null, loading: true, error: null });
  const filtersKey = JSON.stringify(filters);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        let data: DashboardData;
        if (mode === 'demo') {
          // Retardo corto para que el skeleton premium sea perceptible.
          await new Promise((r) => setTimeout(r, 220));
          data = generateDemoDashboard(filters);
        } else {
          const orgId = getOrgId();
          if (!orgId) throw new Error('No se encontró la organización. Vuelve a iniciar sesión.');
          data = await fetchDashboard(orgId, filters);
        }
        if (!cancelled) setState({ data, loading: false, error: null });
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : 'No se pudieron cargar los datos.';
          setState({ data: null, loading: false, error: msg });
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, filtersKey]);

  return state;
}
