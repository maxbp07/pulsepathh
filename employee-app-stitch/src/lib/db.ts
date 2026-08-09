/**
 * PulsePath — Capa de persistencia local (IndexedDB vía Dexie).
 * Datos ANONIMIZADOS: participantId = UUID local (pseudónimo, no PII).
 */
import Dexie, { type Table } from 'dexie';
import type { AppConfig, AssessmentEntry, DailySession, SyncQueueEntry, WeeklyEntry } from './types';

const APP_VERSION = '1.1.0';

class PulsePathDB extends Dexie {
  sessions!: Table<DailySession, string>;
  weekly!: Table<WeeklyEntry, string>;
  assessments!: Table<AssessmentEntry, string>;
  syncQueue!: Table<SyncQueueEntry, string>;
  config!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('pulsepath-stitch');
    this.version(1).stores({
      sessions: 'id, participantId, takenAt, dateLocal',
      weekly: 'id, participantId, takenAt, weekStart',
      config: 'key',
    });
    this.version(2).stores({
      sessions: 'id, participantId, takenAt, dateLocal',
      weekly: 'id, participantId, takenAt, weekStart',
      assessments: 'id, participantId, instrument, timepoint, takenAt, synced',
      syncQueue: 'id, kind, clientRecordId, synced, nextRetryAt, createdAt',
      config: 'key',
    });
  }
}

export const db = new PulsePathDB();

export async function initDb(): Promise<void> {
  try {
    await db.open();
  } catch {
    /* private mode */
  }
}

// ─── Sesiones diarias ────────────────────────────────────────────────────────

/** Sesión ya guardada para un dateLocal (YYYY-MM-DD civil del dispositivo). */
export async function getSessionByDateLocal(dateLocal: string): Promise<DailySession | undefined> {
  return db.sessions.where('dateLocal').equals(dateLocal).first();
}

/**
 * Guarda una sesión diaria. Deduplica por dateLocal: si ya hay una para ese día,
 * no crea otra (evita doble envío / reintento de outbox con otro client_record_id).
 * Devuelve null si el día ya estaba registrado.
 */
export async function saveSession(
  s: Omit<DailySession, 'id' | 'appVersion'>,
): Promise<DailySession | null> {
  const existing = await getSessionByDateLocal(s.dateLocal);
  if (existing) return null;

  const record: DailySession = {
    ...s,
    id: cryptoRandomId(),
    appVersion: APP_VERSION,
  };
  await db.sessions.put(record);
  return record;
}

export async function getSessions(limit = 365): Promise<DailySession[]> {
  return db.sessions.orderBy('takenAt').reverse().limit(limit).toArray();
}

export async function getSessionsSince(iso: string): Promise<DailySession[]> {
  return db.sessions.where('takenAt').above(iso).toArray();
}

export async function getLatestSession(): Promise<DailySession | undefined> {
  const [latest] = await db.sessions.orderBy('takenAt').reverse().limit(1).toArray();
  return latest;
}

// ─── Entradas semanales (legacy UI) ──────────────────────────────────────────

export async function saveWeekly(
  w: Omit<WeeklyEntry, 'id' | 'appVersion'>,
): Promise<WeeklyEntry> {
  const record: WeeklyEntry = { ...w, id: cryptoRandomId(), appVersion: APP_VERSION };
  await db.weekly.put(record);
  return record;
}

export async function getWeekly(limit = 52): Promise<WeeklyEntry[]> {
  return db.weekly.orderBy('takenAt').reverse().limit(limit).toArray();
}

// ─── Cuestionarios estudio ───────────────────────────────────────────────────

export async function saveAssessment(
  a: Omit<AssessmentEntry, 'id' | 'appVersion' | 'synced'>,
): Promise<AssessmentEntry> {
  const record: AssessmentEntry = {
    ...a,
    id: cryptoRandomId(),
    synced: false,
    appVersion: APP_VERSION,
  };
  await db.assessments.put(record);
  return record;
}

export async function getAssessments(limit = 50): Promise<AssessmentEntry[]> {
  return db.assessments.orderBy('takenAt').reverse().limit(limit).toArray();
}

export async function markAssessmentSynced(id: string): Promise<void> {
  await db.assessments.update(id, { synced: true });
}

export async function hasAssessment(
  instrument: AssessmentEntry['instrument'],
  timepoint: AssessmentEntry['timepoint'],
): Promise<boolean> {
  const hit = await db.assessments
    .where({ instrument, timepoint })
    .first();
  return Boolean(hit);
}

// ─── Cola de sincronización ──────────────────────────────────────────────────

export async function addSyncQueueEntry(input: {
  kind: SyncQueueEntry['kind'];
  clientRecordId: string;
  payload: unknown;
}): Promise<SyncQueueEntry> {
  const existing = await findPendingQueueEntry(input.kind, input.clientRecordId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const record: SyncQueueEntry = {
    id: cryptoRandomId(),
    kind: input.kind,
    clientRecordId: input.clientRecordId,
    payload: input.payload,
    createdAt: now,
    attempts: 0,
    nextRetryAt: now,
    synced: false,
  };
  await db.syncQueue.put(record);
  return record;
}

export async function findPendingQueueEntry(
  kind: SyncQueueEntry['kind'],
  clientRecordId: string,
): Promise<SyncQueueEntry | undefined> {
  const all = await db.syncQueue.toArray();
  return all.find((e) => !e.synced && e.kind === kind && e.clientRecordId === clientRecordId);
}

export async function purgeSyncedQueueEntries(olderThanDays = 7): Promise<number> {
  const cutoff = Date.now() - olderThanDays * 24 * 60 * 60 * 1000;
  const synced = await db.syncQueue.filter((e) => e.synced).toArray();
  const toDelete = synced.filter((e) => new Date(e.createdAt).getTime() < cutoff);
  await db.syncQueue.bulkDelete(toDelete.map((e) => e.id));
  return toDelete.length;
}

export async function getPendingSyncEntries(): Promise<SyncQueueEntry[]> {
  const all = await db.syncQueue.toArray();
  return all.filter((e) => !e.synced);
}

export async function markSyncSynced(id: string): Promise<void> {
  await db.syncQueue.update(id, { synced: true, lastError: undefined });
}

export async function markSyncFailed(id: string, error: string, delayMs: number): Promise<void> {
  const entry = await db.syncQueue.get(id);
  if (!entry) return;
  const next = new Date(Date.now() + delayMs).toISOString();
  await db.syncQueue.update(id, {
    attempts: entry.attempts + 1,
    lastError: error,
    nextRetryAt: next,
  });
}

// ─── Config ──────────────────────────────────────────────────────────────────

export async function getConfig<T>(key: string): Promise<T | null> {
  const rec = await db.config.get(key);
  return rec ? (rec.value as T) : null;
}

export async function setConfig<T>(key: string, value: T): Promise<void> {
  await db.config.put({ key, value });
}

export async function getAppConfig(): Promise<AppConfig | null> {
  return getConfig<AppConfig>('app');
}

export async function setAppConfig(cfg: AppConfig): Promise<void> {
  await setConfig('app', cfg);
}

// ─── RGPD ────────────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  await Promise.all([
    db.sessions.clear(),
    db.weekly.clear(),
    db.assessments.clear(),
    db.syncQueue.clear(),
    db.config.clear(),
  ]);
  try {
    localStorage.removeItem('pulsepath.participantId');
    localStorage.removeItem('pulsepath.studyDay0');
  } catch {
    /* noop */
  }
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

export { APP_VERSION };
