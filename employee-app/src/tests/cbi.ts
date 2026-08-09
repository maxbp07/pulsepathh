/**
 * PulsePath — Copenhagen Burnout Inventory (CBI).
 */

const SCALE: Record<string, number> = {
  always: 100,
  often: 75,
  sometimes: 50,
  seldom: 25,
  never: 0,
};

const SCALE_REVERSED: Record<string, number> = {
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
  text: {
    ca: string;
    es: string;
    en: string;
  };
}

export const CBI_QUESTIONS: CbiQuestion[] = [
  // ── Personal ──────────────────────────────────────────────────────────────
  {
    id: 'P1',
    subscale: 'personal',
    text: {
      ca: 'Et sents esgotat/da?',
      es: '¿Te sientes agotado/a?',
      en: 'Do you feel tired?',
    },
  },
  {
    id: 'P2',
    subscale: 'personal',
    text: {
      ca: 'Et sents físicament exhaust/a?',
      es: '¿Te sientes físicamente exhausto/a?',
      en: 'Are you physically exhausted?',
    },
  },
  {
    id: 'P3',
    subscale: 'personal',
    text: {
      ca: 'Et sents emocionalment esgotat/da?',
      es: '¿Te sientes emocionalmente agotado/a?',
      en: 'Are you emotionally exhausted?',
    },
  },
  {
    id: 'P4',
    subscale: 'personal',
    text: {
      ca: "Penses: «No puc més»?",
      es: '¿Piensas: «No puedo más»?',
      en: "Do you think: \u201cI can't take it anymore\u201d?",
    },
  },
  {
    id: 'P5',
    subscale: 'personal',
    text: {
      ca: 'Et sents desgastat/da?',
      es: '¿Te sientes desgastado/a?',
      en: 'Do you feel worn out?',
    },
  },
  {
    id: 'P6',
    subscale: 'personal',
    text: {
      ca: 'Et sents dèbil i susceptible a emmalaltir?',
      es: '¿Te sientes débil y susceptible a enfermar?',
      en: 'Do you feel weak and susceptible to illness?',
    },
  },
  // ── Work-Related ────────────────────────────────────────────────────────────
  {
    id: 'W1',
    subscale: 'work',
    text: {
      ca: 'És el teu treball emocionalment esgotador?',
      es: '¿Es tu trabajo emocionalmente agotador?',
      en: 'Is your work emotionally exhausting?',
    },
  },
  {
    id: 'W2',
    subscale: 'work',
    text: {
      ca: 'Et sents esgotat/da al final de la jornada laboral?',
      es: '¿Te sientes agotado/a al final de la jornada laboral?',
      en: 'Do you feel burnt out at the end of the working day?',
    },
  },
  {
    id: 'W3',
    subscale: 'work',
    text: {
      ca: 'Et sents esgotat/da al matí en pensar en un altre dia de feina?',
      es: '¿Te sientes agotado/a por la mañana al pensar en otro día de trabajo?',
      en: 'Are you exhausted in the morning at the thought of another day at work?',
    },
  },
  {
    id: 'W4',
    subscale: 'work',
    text: {
      ca: 'Sents que cada hora de treball és esgotadora?',
      es: '¿Sientes que cada hora de trabajo es agotadora?',
      en: 'Do you feel that every working hour is tiring for you?',
    },
  },
  {
    id: 'W5',
    subscale: 'work',
    reversed: true,
    text: {
      ca: 'Tens prou energia per a la família i els amics en el temps lliure?',
      es: '¿Tienes suficiente energía para la familia y los amigos en tu tiempo libre?',
      en: 'Do you have enough energy for family and friends during leisure time?',
    },
  },
  {
    id: 'W6',
    subscale: 'work',
    text: {
      ca: 'Et resulta frustrant el teu treball?',
      es: '¿Te resulta frustrante tu trabajo?',
      en: 'Is your work frustrating?',
    },
  },
  {
    id: 'W7',
    subscale: 'work',
    text: {
      ca: 'Et sents cremat/da pel treball?',
      es: '¿Te sientes quemado/a por el trabajo?',
      en: 'Do you feel burnt out because of your work?',
    },
  },
  // ── Client-Related ──────────────────────────────────────────────────────────
  {
    id: 'C1',
    subscale: 'client',
    text: {
      ca: 'Et resulta difícil treballar amb clients/usuaris?',
      es: '¿Te resulta difícil trabajar con clientes/usuarios?',
      en: 'Do you find it hard to work with clients/users?',
    },
  },
  {
    id: 'C2',
    subscale: 'client',
    text: {
      ca: "Treballar amb clients/usuaris t'esgota emocionalment?",
      es: '¿Trabajar con clientes/usuarios te agota emocionalmente?',
      en: 'Does working with clients/users drain your energy?',
    },
  },
  {
    id: 'C3',
    subscale: 'client',
    text: {
      ca: 'Et frustra treballar amb clients/usuaris?',
      es: '¿Te frustra trabajar con clientes/usuarios?',
      en: 'Do you find it frustrating to work with clients/users?',
    },
  },
  {
    id: 'C4',
    subscale: 'client',
    text: {
      ca: 'Sents que dones més del que reps treballant amb clients/usuaris?',
      es: '¿Sientes que das más de lo que recibes trabajando con clientes/usuarios?',
      en: 'Do you feel that you give more than you get back when working with clients/users?',
    },
  },
  {
    id: 'C5',
    subscale: 'client',
    text: {
      ca: "Estàs fart/a de treballar amb clients/usuaris?",
      es: '¿Estás harto/a de trabajar con clientes/usuarios?',
      en: 'Are you tired of working with clients/users?',
    },
  },
  {
    id: 'C6',
    subscale: 'client',
    text: {
      ca: 'Et preguntes quant de temps més podràs continuar treballant amb clients/usuaris?',
      es: '¿Te preguntas cuánto tiempo más podrás seguir trabajando con clientes/usuarios?',
      en: 'Do you wonder how long you will be able to continue working with clients/users?',
    },
  },
];

const SUBSCALE_COUNTS = { personal: 6, work: 7, client: 6 };

function scoreItem(key: string, reversed: boolean): number {
  const table = reversed ? SCALE_REVERSED : SCALE;
  return table[String(key).toLowerCase()] ?? 50;
}

export interface CbiResult {
  personalScore: number;
  workScore: number;
  clientScore: number;
  globalScore: number;
  burnout: boolean;
  subscales: { personal: number; work: number; client: number };
}

export function calculateCbiScore(answers: Record<string, string> | string[] = {}): CbiResult {
  const byId: Record<string, string> = Array.isArray(answers)
    ? CBI_QUESTIONS.reduce((acc: Record<string, string>, q, i) => {
        acc[q.id] = answers[i];
        return acc;
      }, {})
    : (answers as Record<string, string>) || {};

  const sums = { personal: 0, work: 0, client: 0 };

  for (const q of CBI_QUESTIONS) {
    const raw = byId[q.id];
    const value = raw == null ? 50 : scoreItem(raw, q.reversed === true);
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
    subscales: { personal: personalScore, work: workScore, client: clientScore },
  };
}

function clampRound(value: number): number {
  return Math.round(Math.min(100, Math.max(0, value)));
}
