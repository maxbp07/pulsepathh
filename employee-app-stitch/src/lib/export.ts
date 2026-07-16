/**
 * PulsePath — Export de datos.
 *  1) JSON anónimo (machine-readable, SIN PII): backup / analítica.
 *  2) PDF "Cognitive Report" (humano, compartible): Vitality + trend + PVT.
 */
import { jsPDF } from 'jspdf';
import type { DailySession, WeeklyEntry } from './types';
import { bandMeta } from './fri';

// ─── JSON anónimo ────────────────────────────────────────────────────────────

export interface ExportBundle {
  schema: 'pulsepath-anon-v1';
  exportedAt: string;
  note: string;
  sessions: DailySession[];
  weekly: WeeklyEntry[];
}

export async function buildBundle(): Promise<ExportBundle> {
  const { getSessions, getWeekly } = await import('./db');
  const [sessions, weekly] = await Promise.all([getSessions(3650), getWeekly(520)]);
  return {
    schema: 'pulsepath-anon-v1',
    exportedAt: new Date().toISOString(),
    note: 'Anonymized export. participantId is a local pseudonym, not personal data.',
    sessions,
    weekly,
  };
}

export function downloadJson(bundle: ExportBundle): void {
  const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
  triggerDownload(blob, `pulsepath-data-${ymd(new Date())}.json`);
}

// ─── PDF Cognitive Report ────────────────────────────────────────────────────

export function exportPdf(sessions: DailySession[], opts: { email?: string } = {}): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const margin = 40;
  let y = margin;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor('#131b2e');
  doc.text('PulsePath — Cognitive Report', margin, y);
  y += 24;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor('#444655');
  doc.text(`Generated: ${new Date().toLocaleString()}`, margin, y);
  y += 14;
  if (opts.email && opts.email.trim()) {
    doc.text(`Prepared for: ${opts.email.trim()}`, margin, y);
    y += 14;
  }
  doc.text(
    'Anonymized. This document contains no personally identifiable information.',
    margin,
    y,
  );
  y += 24;

  const latest = sessions[0];
  if (!latest) {
    doc.text('No sessions recorded yet.', margin, y);
    doc.save(`pulsepath-report-${ymd(new Date())}.pdf`);
    return;
  }

  // Vitality destacado
  const meta = bandMeta(latest.fri.band);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(48);
  doc.setTextColor(meta.ringStroke);
  doc.text(String(latest.fri.vitality), margin, y + 30);
  doc.setFontSize(12);
  doc.setTextColor('#444655');
  doc.text(`/ 100 Vitality · ${meta.label}`, margin + 70, y + 30);
  doc.text(`Fatigue Risk Index: ${latest.fri.fri}`, margin + 70, y + 46);
  y += 70;

  // Métricas PVT de la última sesión
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor('#131b2e');
  doc.text('Latest PVT-BA session', margin, y);
  y += 18;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  const p = latest.pvt;
  const rows: [string, string][] = [
    ['Date', new Date(latest.takenAt).toLocaleString()],
    ['Valid trials', String(p.trials)],
    ['Mean RT', `${p.meanRt} ms`],
    ['Median RT', `${p.medianRt} ms`],
    ['Lapses (>355ms)', String(p.lapses)],
    ['False starts', String(p.falseStarts)],
    ['Fastest 10%', `${p.fastest10} ms`],
    ['Slowest 10%', `${p.slowest10} ms`],
    ['Mean 1/RT', `${p.meanRrt} /s`],
    ['KSS (sleepiness)', `${latest.kss}/9`],
  ];
  rows.forEach(([k, v]) => {
    doc.setTextColor('#747686');
    doc.text(k, margin, y);
    doc.setTextColor('#131b2e');
    doc.text(v, margin + 160, y);
    y += 16;
  });

  y += 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('Vitality trend (last 14 sessions)', margin, y);
  y += 10;

  // Gráfico de línea simple (últimas 14, invertido cronológico → normal)
  const trend = sessions.slice(0, 14).reverse();
  drawSparkline(doc, margin, y, W - margin * 2, 90, trend.map((s) => s.fri.vitality));
  y += 110;

  // Disclaimer
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor('#747686');
  const disclaimer =
    'PulsePath is a self-monitoring tool and does not provide a medical diagnosis. ' +
    'Vitality/FRI values are estimates from a brief PVT-BA and KSS. ' +
    'Consult a professional for medical advice.';
  doc.text(doc.splitTextToSize(disclaimer, W - margin * 2), margin, y);

  doc.save(`pulsepath-report-${ymd(new Date())}.pdf`);
}

function drawSparkline(
  doc: jsPDF,
  x: number,
  y: number,
  w: number,
  h: number,
  values: number[],
): void {
  if (values.length === 0) return;
  doc.setDrawColor('#264dd9');
  doc.setLineWidth(1.5);
  const min = 0;
  const max = 100;
  const stepX = values.length > 1 ? w / (values.length - 1) : 0;
  values.forEach((v, i) => {
    const px = x + i * stepX;
    const py = y + h - ((v - min) / (max - min)) * h;
    if (i === 0) return;
    const prevX = x + (i - 1) * stepX;
    const prevY = y + h - ((values[i - 1] - min) / (max - min)) * h;
    doc.line(prevX, prevY, px, py);
  });
}

// ─── Util ────────────────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// ─── Interpretación con IA (resumen para ChatGPT/Claude) ──────────────────────

/** Filtra sesiones a los últimos N días (por takenAt). */
export function sessionsInLastDays(sessions: DailySession[], days: number): DailySession[] {
  const cutoff = Date.now() - days * 86_400_000;
  return sessions.filter((s) => new Date(s.takenAt).getTime() >= cutoff);
}

/** Resumen agregado en texto plano para enviar a un asistente de IA. */
export function buildAiPrompt(sessions: DailySession[]): string {
  const n = sessions.length;
  if (n === 0) return 'I have no PulsePath sessions yet.';
  const avg = (sel: (s: DailySession) => number) => sessions.reduce((a, s) => a + sel(s), 0) / n;
  const avgVit = Math.round(avg((s) => s.fri.vitality));
  const avgRt = Math.round(avg((s) => s.pvt.meanRt));
  const avgLapses = +avg((s) => s.pvt.lapses).toFixed(1);
  const avgFastest = Math.round(avg((s) => s.pvt.fastest10));
  const avgKss = +avg((s) => s.kss).toFixed(1);
  const sleeps = sessions
    .map((s) => s.context?.sleepHours)
    .filter((v): v is number => typeof v === 'number');
  const avgSleep = sleeps.length
    ? +(sleeps.reduce((a, b) => a + b, 0) / sleeps.length).toFixed(1)
    : null;
  const optimal = sessions.filter((s) => s.fri.band === 'optimal').length;
  const latest = sessions[0];

  return [
    `PulsePath self-monitoring summary (${n} sessions).`,
    `Vitality Index: latest ${latest.fri.vitality}/100, average ${avgVit}/100.`,
    `PVT-BA reaction time: average ${avgRt} ms; fastest 10% average ${avgFastest} ms.`,
    `Lapses (RT > 355 ms): average ${avgLapses} per session.`,
    `Karolinska Sleepiness Scale: average ${avgKss}/9 (higher = sleepier).`,
    avgSleep != null ? `Self-reported sleep: average ${avgSleep} h/night.` : '',
    `Optimal-alertness days: ${optimal} of ${n}.`,
    '',
    'Please interpret these results in plain language: how is my alertness/fatigue trending, what stands out, and what lifestyle changes might help. Note this is self-monitoring, not a medical diagnosis.',
  ]
    .filter(Boolean)
    .join('\n');
}

/** Abre Claude con el prompt precargado (claude.ai admite ?q=). */
export function openClaude(prompt: string): void {
  const url = `https://claude.ai/new?q=${encodeURIComponent(prompt)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * ChatGPT no admite prompt precargado por URL de forma fiable: copiamos al
 * portapapeles y abrimos chatgpt.com para que el usuario lo pegue.
 * Devuelve true si el copiado funcionó.
 */
export async function openChatgpt(prompt: string): Promise<boolean> {
  let copied = false;
  try {
    await navigator.clipboard.writeText(prompt);
    copied = true;
  } catch {
    copied = false;
  }
  window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
  return copied;
}
