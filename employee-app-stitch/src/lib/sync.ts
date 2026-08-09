/**
 * Sincroniza sesiones y cuestionarios vía outbox durable.
 */
import type { DailySession } from './types';
import { isApiEnabled } from './api';
import { APP_VERSION as LOCAL_APP_VERSION } from './db';
import { enqueueDaily } from './outbox';
import { localDateISO, setStudyDay0, getStudyDay0 } from './studySchedule';

export async function syncDailySession(
  session: DailySession,
): Promise<'queued' | 'skipped' | 'failed'> {
  if (!isApiEnabled()) return 'skipped';
  if (!session.context) return 'failed';

  if (!getStudyDay0()) {
    setStudyDay0(session.dateLocal ?? localDateISO());
  }

  await enqueueDaily({
    client_record_id: session.id,
    date_local: session.dateLocal,
    tz: session.tz,
    timestamp: session.takenAt,
    kss: session.kss,
    context: session.context,
    pvt: session.pvt as unknown as Record<string, unknown>,
    derived: { fri: session.fri.fri, vitality: session.fri.vitality },
    app_version: session.appVersion ?? LOCAL_APP_VERSION,
  });

  return 'queued';
}

export { flushOutbox, getSyncStatus, enqueueQuestionnaire } from './outbox';
