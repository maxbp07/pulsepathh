import type { FriBand } from './config';
import type { PerfCategory } from './pvtBa';

/** Métricas crudas de una sesión PVT-BA (set completo Basner + categoría adaptativa). */
export interface PvtMetrics {
  trials: number; // ensayos válidos
  lapses: number; // RT > 355ms
  falseStarts: number;
  meanRt: number;
  medianRt: number;
  sdRt: number;
  fastest10: number; // media del 10% más rápido
  slowest10: number; // media del 10% más lento
  meanRrt: number; // media de 1/RT (1/s) — robustez frente a outliers
  durationMs: number; // duración real de la sesión (adaptativa, media ~103s)
  times: number[]; // RTs válidos crudos
  lpfs: number; // lapses + false starts (métrica primaria PVT-BA)
  category: PerfCategory; // clasificación adaptativa HIGH/MEDIUM/LOW
  stoppedEarly: boolean; // true si el algoritmo paró antes de 3 min
}

export interface FriBreakdown {
  lapses: number; // contribución ponderada 0-100
  meanRt: number;
  meanRrt: number;
  kss: number;
}

export interface FriResult {
  fri: number; // 0-100, mayor = más riesgo de fatiga
  vitality: number; // 100 - fri (lo que muestra el dashboard)
  band: FriBand;
  breakdown: FriBreakdown;
}

/**
 * Contexto subjetivo del check-in (metadata: NO entra en el FRI validado).
 * Impulsa los insights/correlaciones del dashboard y la analítica.
 */
export interface CheckinContext {
  sleepHours: number; // 0-12
  quality: number; // 1-5 estrellas
  coffee: boolean; // café en las últimas 4 h
}

/**
 * Sesión diaria. Anónima: sin nombre, email ni IP.
 * participantId = código de acceso (pseudónimo, no identidad).
 */
export interface DailySession {
  id: string;
  participantId: string;
  takenAt: string; // ISO timestamp
  dateLocal: string; // YYYY-MM-DD
  tz: string; // Intl timezone
  pvt: PvtMetrics;
  kss: number; // 1-9
  context?: CheckinContext; // metadata opcional (puede faltar en sesiones viejas)
  fri: FriResult;
  appVersion: string;
}

/** Entrada semanal (DASS-21 estrés + Single-Item Burnout). */
export interface WeeklyEntry {
  id: string;
  participantId: string;
  takenAt: string;
  weekStart: string; // YYYY-MM-DD (lunes)
  dassStressRaw: number; // 0-21 (7 ítems × 0-3)
  dassStressIndex: number; // 0-100 normalizado
  sib: number; // 1-5
  appVersion: string;
}

export interface AppConfig {
  participantId: string;
  onboarded: boolean;
  createdAt: string;
}

export type StudyTimepoint = 'D0' | 'D7' | 'D14';

/** Cuestionario del estudio guardado localmente (DASS / GAD-7 / CBI). */
export interface AssessmentEntry {
  id: string;
  participantId: string;
  instrument: 'DASS21_FULL' | 'GAD7' | 'CBI';
  timepoint: StudyTimepoint;
  takenAt: string;
  synced: boolean;
  appVersion: string;
}

export type SyncQueueKind = 'daily' | 'questionnaire';

export interface SyncQueueEntry {
  id: string;
  kind: SyncQueueKind;
  clientRecordId: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastError?: string;
  nextRetryAt: string;
  synced: boolean;
}
