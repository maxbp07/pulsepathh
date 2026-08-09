/**
 * Cola durable de sincronización con reintentos exponenciales.
 */
import {
  addSyncQueueEntry,
  getPendingSyncEntries,
  markSyncFailed,
  markSyncSynced,
  markAssessmentSynced,
  purgeSyncedQueueEntries,
  findPendingQueueEntry,
} from './db';
import type { SyncQueueEntry } from './types';
import {
  isApiEnabled,
  syncDailyCheckin,
  syncQuestionnaire,
  type DailyCheckinPayload,
  type QuestionnairePayload,
  type SyncResult,
} from './api';
import { hasConsent } from './prefs';

const MAX_ATTEMPTS = 8;
const BASE_DELAY_MS = 5_000;

export interface SyncStatus {
  pending: number;
  failed: number;
  lastSyncedAt: string | null;
  terminalErrors: number;
}

let lastSyncedAt: string | null = null;
let flushing = false;

function backoffMs(attempts: number): number {
  return Math.min(BASE_DELAY_MS * 2 ** attempts, 30 * 60 * 1000);
}

export async function enqueueDaily(payload: DailyCheckinPayload): Promise<void> {
  if (!hasConsent()) return;
  const existing = await findPendingQueueEntry('daily', payload.client_record_id);
  if (!existing) {
    await addSyncQueueEntry({
      kind: 'daily',
      clientRecordId: payload.client_record_id,
      payload,
    });
  }
  await flushOutbox();
}

export async function enqueueQuestionnaire(payload: QuestionnairePayload): Promise<void> {
  if (!hasConsent()) return;
  const existing = await findPendingQueueEntry('questionnaire', payload.client_record_id);
  if (!existing) {
    await addSyncQueueEntry({
      kind: 'questionnaire',
      clientRecordId: payload.client_record_id,
      payload,
    });
  }
  await flushOutbox();
}

function classifyResult(result: SyncResult): 'ok' | 'retry' | 'drop' {
  if (result === 'stored' || result === 'duplicate') return 'ok';
  if (result === 'conflict' || result === 'ineligible') return 'drop';
  return 'retry';
}

async function dispatch(entry: SyncQueueEntry): Promise<'ok' | 'retry' | 'drop'> {
  if (!isApiEnabled() || !hasConsent()) return 'retry';

  if (entry.kind === 'daily') {
    const result = await syncDailyCheckin(entry.payload as DailyCheckinPayload);
    const outcome = classifyResult(result);
    if (outcome === 'retry' && entry.attempts + 1 >= MAX_ATTEMPTS) return 'drop';
    return outcome;
  }

  const result = await syncQuestionnaire(entry.payload as QuestionnairePayload);
  const outcome = classifyResult(result);
  if (outcome === 'retry' && entry.attempts + 1 >= MAX_ATTEMPTS) return 'drop';
  return outcome;
}

export async function flushOutbox(): Promise<SyncStatus> {
  if (flushing) return getSyncStatus();
  flushing = true;
  try {
    const pending = await getPendingSyncEntries();
    const now = Date.now();

    for (const entry of pending) {
      if (new Date(entry.nextRetryAt).getTime() > now) continue;

      const outcome = await dispatch(entry);
      if (outcome === 'ok') {
        await markSyncSynced(entry.id);
        if (entry.kind === 'questionnaire') {
          await markAssessmentSynced(entry.clientRecordId);
        }
        lastSyncedAt = new Date().toISOString();
      } else if (outcome === 'retry') {
        await markSyncFailed(entry.id, 'sync failed', backoffMs(entry.attempts + 1));
      } else {
        await markSyncFailed(entry.id, 'terminal: conflict or ineligible', 365 * 24 * 60 * 60 * 1000);
        await markSyncSynced(entry.id);
      }
    }

    await purgeSyncedQueueEntries(7);
  } finally {
    flushing = false;
  }
  return getSyncStatus();
}

export async function getSyncStatus(): Promise<SyncStatus> {
  const pending = await getPendingSyncEntries();
  const failed = pending.filter((e) => e.attempts >= MAX_ATTEMPTS).length;
  const terminalErrors = pending.filter((e) => e.lastError?.startsWith('terminal:')).length;
  return {
    pending: pending.length,
    failed,
    lastSyncedAt,
    terminalErrors,
  };
}
