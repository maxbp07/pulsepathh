/**
 * PulsePath — Persistencia local (IndexedDB con fallback a localStorage).
 */

export interface PvtMetrics {
  trials: number;
  lapses: number;
  falseStarts: number;
  meanRt: number;
  medianRt: number;
  sdRt: number;
  p10Slowest: number;
  times: number[];
}

export interface StroopMetrics {
  errors: number;
  trials: number;
  meanRt: number;
  sdRt: number;
  times: number[];
}

export interface Session {
  id: string;
  takenAt: string;
  riskIndex: number;
  pvtIndex: number;
  stroopIndex: number;
  cbiScore: number;
  sleepHours: number;
  pvtMetrics?: PvtMetrics;
  stroopMetrics?: StroopMetrics;
}

const DB_NAME = 'pulsepath-db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_CONFIG = 'config';

const LS_SESSIONS_KEY = 'pulsepath_sessions';
const LS_CONFIG_PREFIX = 'pulsepath_config_';

let dbPromise: Promise<IDBDatabase | null> | null = null;
let useFallback = false;

function hasIndexedDb(): boolean {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Abre (o crea) la base de datos. Idempotent.
 */
export function initDb(): Promise<IDBDatabase | null> {
  if (useFallback) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  if (!hasIndexedDb()) {
    useFallback = true;
    return Promise.resolve(null);
  }

  dbPromise = new Promise<IDBDatabase | null>((resolve) => {
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      useFallback = true;
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SESSIONS)) {
        const sessions = db.createObjectStore(STORE_SESSIONS, { keyPath: 'id' });
        sessions.createIndex('takenAt', 'takenAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CONFIG)) {
        db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      useFallback = true;
      resolve(null);
    };
    request.onblocked = () => {
      useFallback = true;
      resolve(null);
    };
  });

  return dbPromise;
}

async function getDb(): Promise<IDBDatabase | null> {
  return initDb();
}

function txComplete(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Transacción abortada'));
    tx.onerror = () => reject(tx.error || new Error('Error de transacción'));
  });
}

function reqResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error de petición'));
  });
}

// ─── localStorage helpers (fallback) ─────────────────────────────────────────

function lsReadSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function lsWriteSessions(sessions: Session[]): void {
  try {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Fallback silencioso
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Guarda una sesión.
 */
export async function saveSession(session: Session): Promise<void> {
  const db = await getDb();

  if (db) {
    try {
      const tx = db.transaction(STORE_SESSIONS, 'readwrite');
      tx.objectStore(STORE_SESSIONS).put(session);
      await txComplete(tx);
      return;
    } catch {
      useFallback = true;
    }
  }

  const sessions = lsReadSessions();
  const filtered = sessions.filter((s) => s.id !== session.id);
  filtered.push(session);
  lsWriteSessions(filtered);
}

/**
 * Retorna las últimas N sesiones ordenadas por takenAt DESC.
 */
export async function getSessions(limit = 30): Promise<Session[]> {
  const db = await getDb();

  if (db) {
    try {
      const tx = db.transaction(STORE_SESSIONS, 'readonly');
      const all = await reqResult(tx.objectStore(STORE_SESSIONS).getAll());
      return sortAndLimit(all, limit);
    } catch {
      useFallback = true;
    }
  }

  return sortAndLimit(lsReadSessions(), limit);
}

function sortAndLimit(sessions: Session[], limit: number): Session[] {
  const arr = Array.isArray(sessions) ? [...sessions] : [];
  arr.sort((a, b) => String(b.takenAt).localeCompare(String(a.takenAt)));
  const n = Number.isFinite(limit) && limit > 0 ? limit : arr.length;
  return arr.slice(0, n);
}

/**
 * Obtiene un valor de configuración.
 */
export async function getConfig<T>(key: string): Promise<T | null> {
  const db = await getDb();

  if (db) {
    try {
      const tx = db.transaction(STORE_CONFIG, 'readonly');
      const record = await reqResult(tx.objectStore(STORE_CONFIG).get(key));
      return record ? record.value : null;
    } catch {
      useFallback = true;
    }
  }

  try {
    const raw = localStorage.getItem(LS_CONFIG_PREFIX + key);
    return raw == null ? null : JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Guarda un valor de configuración.
 */
export async function setConfig<T>(key: string, value: T): Promise<void> {
  const db = await getDb();

  if (db) {
    try {
      const tx = db.transaction(STORE_CONFIG, 'readwrite');
      tx.objectStore(STORE_CONFIG).put({ key, value });
      await txComplete(tx);
      return;
    } catch {
      useFallback = true;
    }
  }

  try {
    localStorage.setItem(LS_CONFIG_PREFIX + key, JSON.stringify(value));
  } catch {
    // Fallback silencioso
  }
}

/**
 * Borra todas las dades locales (derecho al olvido, RGPD).
 */
export async function clearAll(): Promise<void> {
  const db = await getDb();

  if (db) {
    try {
      const tx = db.transaction([STORE_SESSIONS, STORE_CONFIG], 'readwrite');
      tx.objectStore(STORE_SESSIONS).clear();
      tx.objectStore(STORE_CONFIG).clear();
      await txComplete(tx);
    } catch {
      useFallback = true;
    }
  }

  try {
    localStorage.removeItem(LS_SESSIONS_KEY);
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_CONFIG_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Fallback silencioso
  }
}
