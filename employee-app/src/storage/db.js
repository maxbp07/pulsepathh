/**
 * PulsePath — Persistència local (IndexedDB amb fallback a localStorage).
 *
 * Sense dependències externes (API nativa d'IndexedDB, no la llibreria `idb`).
 * Si IndexedDB no està disponible (mode privat, restriccions del navegador),
 * s'utilitza localStorage com a fallback silenciós.
 *
 * DB: "pulsepath-db", versió 1.
 * Object stores:
 *   - "sessions": keyPath "id", índex per "takenAt".
 *   - "config":   keyPath "key".
 */

const DB_NAME = 'pulsepath-db';
const DB_VERSION = 1;
const STORE_SESSIONS = 'sessions';
const STORE_CONFIG = 'config';

const LS_SESSIONS_KEY = 'pulsepath_sessions';
const LS_CONFIG_PREFIX = 'pulsepath_config_';

let dbPromise = null;
let useFallback = false;

function hasIndexedDb() {
  try {
    return typeof indexedDB !== 'undefined' && indexedDB !== null;
  } catch {
    return false;
  }
}

/**
 * Obre (o crea) la base de dades. Idempotent: reutilitza la mateixa promesa.
 * @returns {Promise<IDBDatabase|null>} null si s'usa el fallback de localStorage.
 */
export function initDb() {
  if (useFallback) return Promise.resolve(null);
  if (dbPromise) return dbPromise;

  if (!hasIndexedDb()) {
    useFallback = true;
    return Promise.resolve(null);
  }

  dbPromise = new Promise((resolve) => {
    let request;
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

async function getDb() {
  return initDb();
}

function txComplete(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Transacció avortada'));
    tx.onerror = () => reject(tx.error || new Error('Error de transacció'));
  });
}

function reqResult(request) {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Error de petició'));
  });
}

// ─── localStorage helpers (fallback) ─────────────────────────────────────────

function lsReadSessions() {
  try {
    const raw = localStorage.getItem(LS_SESSIONS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function lsWriteSessions(sessions) {
  try {
    localStorage.setItem(LS_SESSIONS_KEY, JSON.stringify(sessions));
  } catch {
    // Emmagatzematge ple o no disponible: fallback silenciós.
  }
}

// ─── API pública ──────────────────────────────────────────────────────────────

/**
 * Desa una sessió. Si IndexedDB falla, fallback a localStorage.
 * @param {{
 *   id: string, takenAt: string, riskIndex: number, pvtIndex: number,
 *   stroopIndex: number, cbiScore: number, sleepHours: number,
 *   pvtMetrics?: object, stroopMetrics?: object
 * }} session
 * @returns {Promise<void>}
 */
export async function saveSession(session) {
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
 * Retorna les últimes N sessions ordenades per takenAt DESC.
 * @param {number} [limit=30]
 * @returns {Promise<object[]>}
 */
export async function getSessions(limit = 30) {
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

function sortAndLimit(sessions, limit) {
  const arr = Array.isArray(sessions) ? [...sessions] : [];
  arr.sort((a, b) => String(b.takenAt).localeCompare(String(a.takenAt)));
  const n = Number.isFinite(limit) && limit > 0 ? limit : arr.length;
  return arr.slice(0, n);
}

/**
 * Obté un valor de configuració.
 * @param {string} key
 * @returns {Promise<*>} el valor desat o null si no existeix.
 */
export async function getConfig(key) {
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
 * Desa un valor de configuració.
 * @param {string} key
 * @param {*} value
 * @returns {Promise<void>}
 */
export async function setConfig(key, value) {
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
    // Fallback silenciós.
  }
}

/**
 * Esborra totes les dades locals (dret de supressió, RGPD).
 * @returns {Promise<void>}
 */
export async function clearAll() {
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

  // Neteja també el fallback de localStorage (per coherència).
  try {
    localStorage.removeItem(LS_SESSIONS_KEY);
    const toRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_CONFIG_PREFIX)) toRemove.push(key);
    }
    toRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Fallback silenciós.
  }
}
