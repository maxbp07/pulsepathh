/**
 * Copenhagen Burnout Inventory (CBI) — 19 ítems.
 * API espera valores ALWAYS|OFTEN|SOMETIMES|SELDOM|NEVER.
 */

export type CbiScaleKey = 'always' | 'often' | 'sometimes' | 'seldom' | 'never';

export const CBI_SCALE_ORDER: CbiScaleKey[] = [
  'always',
  'often',
  'sometimes',
  'seldom',
  'never',
];

const SCALE: Record<CbiScaleKey, number> = {
  always: 100,
  often: 75,
  sometimes: 50,
  seldom: 25,
  never: 0,
};

const SCALE_REVERSED: Record<CbiScaleKey, number> = {
  always: 0,
  often: 25,
  sometimes: 50,
  seldom: 75,
  never: 100,
};

export const BURNOUT_THRESHOLD = 50;

export interface CbiQuestion {
  id: string;
  subscale: 'personal' | 'work' | 'client';
  reversed?: boolean;
}

export const CBI_QUESTIONS: CbiQuestion[] = [
  { id: 'P1', subscale: 'personal' },
  { id: 'P2', subscale: 'personal' },
  { id: 'P3', subscale: 'personal' },
  { id: 'P4', subscale: 'personal' },
  { id: 'P5', subscale: 'personal' },
  { id: 'P6', subscale: 'personal' },
  { id: 'W1', subscale: 'work' },
  { id: 'W2', subscale: 'work' },
  { id: 'W3', subscale: 'work' },
  { id: 'W4', subscale: 'work' },
  { id: 'W5', subscale: 'work', reversed: true },
  { id: 'W6', subscale: 'work' },
  { id: 'W7', subscale: 'work' },
  { id: 'C1', subscale: 'client' },
  { id: 'C2', subscale: 'client' },
  { id: 'C3', subscale: 'client' },
  { id: 'C4', subscale: 'client' },
  { id: 'C5', subscale: 'client' },
  { id: 'C6', subscale: 'client' },
];

const SUBSCALE_COUNTS = { personal: 6, work: 7, client: 6 };

function scoreItem(key: CbiScaleKey, reversed: boolean): number {
  return reversed ? SCALE_REVERSED[key] : SCALE[key];
}

export interface CbiResult {
  personalScore: number;
  workScore: number;
  clientScore: number;
  globalScore: number;
  burnout: boolean;
}

export function calculateCbiScore(answers: Record<string, CbiScaleKey>): CbiResult {
  const sums = { personal: 0, work: 0, client: 0 };

  for (const q of CBI_QUESTIONS) {
    const raw = answers[q.id] ?? 'sometimes';
    const value = scoreItem(raw, q.reversed === true);
    sums[q.subscale] += value;
  }

  const personalScore = clampRound(sums.personal / SUBSCALE_COUNTS.personal);
  const workScore = clampRound(sums.work / SUBSCALE_COUNTS.work);
  const clientScore = clampRound(sums.client / SUBSCALE_COUNTS.client);
  const totalItems = SUBSCALE_COUNTS.personal + SUBSCALE_COUNTS.work + SUBSCALE_COUNTS.client;
  const globalScore = clampRound((sums.personal + sums.work + sums.client) / totalItems);

  return {
    personalScore,
    workScore,
    clientScore,
    globalScore,
    burnout: globalScore >= BURNOUT_THRESHOLD,
  };
}

/** Convierte clave local a valor API (uppercase). */
export function cbiValueForApi(key: CbiScaleKey): string {
  return key.toUpperCase();
}

function clampRound(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
