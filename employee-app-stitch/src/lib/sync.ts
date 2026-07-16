/**
 * Mapea una DailySession stitch al schema de sesión del backend Node
 * y sincroniza si hay API configurada.
 *
 * Mapeo de campos (honesto):
 *   risk_index  ← FRI (0-100, mayor = más fatiga)
 *   pvt_index   ← rendimiento PVT normalizado
 *   stroop_index← KSS 1-9 normalizado a 0-100 (somnolencia)
 *   sleep_hours ← contexto de sueño del check-in
 */
import type { DailySession } from './types';
import { syncSession, isApiEnabled } from './api';

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function pvtPerformanceIndex(session: DailySession): number {
  const { pvt } = session;
  const lapseRate = pvt.trials > 0 ? pvt.lapses / pvt.trials : 0;
  const rtNorm = clamp((pvt.meanRt - 250) / 200, 0, 1);
  return clamp(lapseRate * 100 * 0.55 + rtNorm * 100 * 0.45, 0, 100);
}

function kssToIndex(kss: number): number {
  return clamp(((kss - 1) / 8) * 100, 0, 100);
}

export async function syncDailySession(session: DailySession): Promise<void> {
  if (!isApiEnabled()) return;
  const ok = await syncSession({
    timestamp: session.takenAt,
    risk_index: clamp(session.fri.fri, 0, 100),
    pvt_index: pvtPerformanceIndex(session),
    stroop_index: kssToIndex(session.kss),
    sleep_hours: clamp(session.context?.sleepHours ?? 7, 0, 24),
  });
  if (!ok) {
    console.warn('[PulsePath] sync session failed — data kept locally');
  }
}
