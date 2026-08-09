// Contrato de GET /api/v1/dashboard/:orgId — fuente de verdad: backend/lib/kanon.js
// y backend/controllers/dashboard.controller.js.

export type DriverKey = 'pvt' | 'stroop' | 'cbi' | 'sleep';
export type SemaphoreColor = 'green' | 'yellow' | 'red';
export type SegmentDimension =
  | 'department'
  | 'shift'
  | 'gender'
  | 'ageBand'
  | 'tenureBand';

/** Desglose de drivers: porcentajes 0-100 de contribución + driver dominante. */
export interface Drivers {
  pvt: number;
  stroop: number;
  cbi: number;
  sleep: number;
  dominant: DriverKey;
}

/** Métricas comunes a cualquier grupo (departamento, segmento, celda, org). */
export interface Metrics {
  count?: number;
  count_unique_users?: number;
  avg_risk_index?: number;
  avg_pvt_index?: number;
  avg_stroop_index?: number;
  avg_cbi_score?: number | null;
  avg_sleep_hours?: number | null;
  pct_high_risk?: number;
  drivers?: Drivers | null;
  trend?: number[];
  kanon_protected?: boolean;
  message?: string;
}

/** Grupo legado por departamento (data.groups). */
export interface DepartmentGroup extends Metrics {
  department: string;
}

/** Segmento de una dimensión (data.segments[dim][i]). */
export interface Segment extends Metrics {
  group: string;
  dimension: SegmentDimension;
}

export interface HeatmapCell {
  row: string;
  col: string;
  avg_risk_index?: number | null;
  pct_high_risk?: number | null;
  count_unique_users?: number;
  kanon_protected?: boolean;
  empty?: boolean;
}

export interface Heatmap {
  rowKey: SegmentDimension;
  colKey: SegmentDimension;
  rows: string[];
  cols: string[];
  cells: HeatmapCell[];
}

/** data.org_total */
export interface OrgTotal extends Metrics {}

export interface DashboardData {
  groups: DepartmentGroup[];
  org_total: OrgTotal;
  segments: Record<SegmentDimension, Segment[]>;
  heatmap: Heatmap;
  heatmaps: Heatmap[];
}

/** Respuesta del login de empleador (POST /api/v1/auth/login). */
export interface LoginResponse {
  token: string;
  orgId: string;
  role?: string;
}
