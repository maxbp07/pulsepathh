/**
 * PulsePath — Capa de persistencia local (IndexedDB vía Dexie).
 * Datos ANONIMIZADOS: participantId = UUID local (pseudónimo, no PII).
 * Sin nombre, email ni IP en ningún registro.
 */
import Dexie, { type Table } from 'dexie';
import type { AppConfig, DailySession, WeeklyEntry } from './types';

const APP_VERSION = '1.0.0';

class PulsePathDB extends Dexie {
  sessions!: Table<DailySession, string>;
  weekly!: Table<WeeklyEntry, string>;
  config!: Table<{ key: string; value: unknown }, string>;

  constructor() {
    super('pulsepath-stitch');
    this.version(1).stores({
      // Indexamos por fecha para rangos/tendencias; participantId para filtrar.
      sessions: 'id, participantId, takenAt, dateLocal',
      weekly: 'id, participantId, takenAt, weekStart',
      config: 'key',
    });
  }
}

export const db = new PulsePathDB();

/** Garantiza que IndexedDB exista (Dexie lo crea perezosamente; esto fuerza open). */
export async function initDb(): Promise<void> {
  try {
    await db.open();
  } catch {
    // En navegadores sin IndexedDB (modo privado estricto), Dexie caerá en
    // errores posteriores; las llamadas usan try/catch y fallback opcional.
  }
}

// ─── Sesiones diarias ────────────────────────────────────────────────────────

export async function saveSession(s: Omit<DailySession, 'id' | 'appVersion'>): Promise<DailySession> {
  const record: DailySession = {
    ...s,
    id: cryptoRandomId(),
    appVersion: APP_VERSION,
  };
  await db.sessions.put(record);
  return record;
}

export async function getSessions(limit = 365): Promise<DailySession[]> {
  const all = await db.sessions.orderBy('takenAt').reverse().limit(limit).toArray();
  return all;
}

export async function getSessionsSince(iso: string): Promise<DailySession[]> {
  return db.sessions.where('takenAt').above(iso).toArray();
}

export async function getLatestSession(): Promise<DailySession | undefined> {
  const [latest] = await db.sessions.orderBy('takenAt').reverse().limit(1).toArray();
  return latest;
}

// ─── Entradas semanales ──────────────────────────────────────────────────────

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

// ─── Config (onboarding, prefs) ──────────────────────────────────────────────

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

// ─── Derecho al olvido (RGPD): borrar TODOS los datos ───────────────────────

export async function clearAll(): Promise<void> {
  await Promise.all([db.sessions.clear(), db.weekly.clear(), db.config.clear()]);
  try {
    localStorage.removeItem('pulsepath.participantId');
  } catch {
    /* noop */
  }
}

// ─── Util ────────────────────────────────────────────────────────────────────

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 10)
  );
}

export { APP_VERSION };
