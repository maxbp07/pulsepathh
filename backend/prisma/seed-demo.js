// PulsePath — Seed de DEMO (piloto Ayuntamiento de Barcelona)
// =============================================================================
// Genera datos realistas de 8 semanas para que el dashboard, las gráficas, las
// alertas y el Informe PDF luzcan poblados en una demo en vivo.
//
// Narrativa pensada para el pitch:
//   - "Atención ciudadana" (A001–A025, turno mañana): plantilla SANA y que
//     MEJORA con el tiempo (el departamento modelo).
//   - "Informática" (A026–A049, turno tarde): riesgo ELEVADO impulsado por
//     burnout (CBI alto) y que EMPEORA → dispara la alerta >20% de riesgo alto
//     y permite al Informe PDF concluir "burnout estructural".
//   - A050 se deja SIN sesiones: es el código limpio para hacer un check-in en
//     directo durante la reunión.
//
// Es idempotente y destructivo con las sesiones: borra las sesiones previas de
// la organización y las regenera. Sirve también como "reset" entre ensayos.
//
// Uso:
//   cd backend
//   node prisma/seed-demo.js
// (Requiere backend/.env con DATABASE_URL y ENCRYPTION_KEY.)
// =============================================================================

import 'dotenv/config';
import { createHash } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { encryptNumber } from '../src/lib/crypto.js';

const prisma = new PrismaClient();

const ORG = {
  name: 'Ayuntamiento de Barcelona',
  slug: 'ayuntamiento_bcn',
  pilotRef: '2026_OVT_694068',
  retentionUntil: new Date('2027-12-31'),
};

const EMPLOYER_USER = {
  email: 'rrhh@bcn.cat',
  password: 'demo1234',
  role: 'admin',
};

const BCRYPT_ROUNDS = 10;
const ACCESS_CODE_COUNT = 50;

// Generación de sesiones.
const WEEKS = 8; // 8 semanas de historial (duración del piloto)
const SESSIONS_PER_WEEK_MIN = 3;
const SESSIONS_PER_WEEK_MAX = 4;
const RESERVED_LIVE_CODE = 50; // A050 queda limpio para la demo en vivo

// Pesos del índice de riesgo (idénticos a risk_engine.js).
const W = { pvt: 0.4, stroop: 0.25, cbi: 0.25, sleep: 0.1 };

// Perfiles por departamento. base = valor medio del índice (0-100, más alto = peor).
const PROFILES = {
  atencion_ciudadana: {
    department: 'atencion_ciudadana',
    shift: 'morning',
    pvtBase: 26,
    stroopBase: 24,
    cbiBase: 28,
    sleepBase: 7.3,
    // Mejora con el tiempo: las semanas tempranas tienen algo más de riesgo.
    trendSign: -1,
  },
  informatica: {
    department: 'informatica',
    shift: 'afternoon',
    pvtBase: 48,
    stroopBase: 45,
    cbiBase: 63, // burnout dominante → driver "estructural" en el informe
    sleepBase: 5.4,
    // Empeora con el tiempo.
    trendSign: 1,
  },
};

// ---------------------------------------------------------------------------
// Dimensiones demográficas / organizativas (para segmentar el dashboard).
//
// Se reparten de forma DETERMINISTA por índice de código, de modo que cada
// vista de UNA dimensión (turno, género, edad, antigüedad) tenga grupos con
// ≥5 personas únicas y supere el filtro de K-anonimidad (K=5). Los cruces
// (p. ej. "mujeres del turno de noche de Informática") sí pueden quedar por
// debajo de 5 y se suprimen automáticamente — eso demuestra la privacidad.
// ---------------------------------------------------------------------------

const GENDERS = ['male', 'female'];
const AGE_BANDS = ['u30', '30_45', '45_60', 'o60'];
const TENURE_BANDS = ['u2', '2_5', '5_10', 'o10'];

// Modificador de riesgo por turno (puntos sobre la fatiga/sueño).
// El turno de noche es el más penalizado → historia clara para el empleador.
const SHIFT_RISK = {
  morning: { pvt: 0, sleep: 0 },
  afternoon: { pvt: 3, sleep: -0.3 },
  night: { pvt: 12, sleep: -1.1 },
};

// Modificador de burnout por edad (el agotamiento acumulado sube con la edad).
const AGE_CBI = { u30: 1, '30_45': 0, '45_60': 4, o60: 7 };

function hashCode(code) {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

function buildAccessCode(index) {
  return `BCN-2026-A${String(index).padStart(3, '0')}`;
}

// Departamento + turno por índice (mantiene la narrativa del pitch y crea
// 4 celdas pobladas en el mapa de calor Departamento × Turno).
function deptShiftForIndex(index) {
  if (index <= 18) return { department: 'atencion_ciudadana', shift: 'morning' };
  if (index <= 25) return { department: 'atencion_ciudadana', shift: 'afternoon' };
  if (index <= 37) return { department: 'informatica', shift: 'afternoon' };
  return { department: 'informatica', shift: 'night' };
}

// Conjunto completo de dimensiones para un código.
function dimensionsForIndex(index) {
  const { department, shift } = deptShiftForIndex(index);
  return {
    department,
    shift,
    gender: GENDERS[index % GENDERS.length],
    ageBand: AGE_BANDS[index % AGE_BANDS.length],
    // Desfase respecto a la edad para que antigüedad y edad no estén correladas.
    tenureBand: TENURE_BANDS[(index + 2) % TENURE_BANDS.length],
  };
}

function baseProfileForDept(department) {
  return department === 'atencion_ciudadana'
    ? PROFILES.atencion_ciudadana
    : PROFILES.informatica;
}

// Ruido pseudo-gaussiano (suma de uniformes) en el rango [-spread, +spread].
function noise(spread) {
  const r = (Math.random() + Math.random() + Math.random()) / 3 - 0.5;
  return r * 2 * spread;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

// Penalización por horas de sueño (idéntica a risk_engine.calculateSleepPenalty).
function sleepPenalty(hours) {
  if (hours >= 7) return 0;
  if (hours >= 5) return 25;
  if (hours >= 4) return 50;
  return 75;
}

// Devuelve la fecha de un día laborable aleatorio dentro de la semana `weekIdx`
// contando hacia atrás desde hoy (week 0 = hace 7 semanas, ... week 7 = esta semana).
function dateInWeek(weekIdx) {
  const now = new Date();
  const weeksAgo = WEEKS - 1 - weekIdx; // weekIdx alto = más reciente
  const base = new Date(now);
  base.setDate(base.getDate() - weeksAgo * 7);
  // Elige un día laborable (lun-vie) de esa semana.
  const weekday = 1 + Math.floor(Math.random() * 5); // 1..5
  const day = new Date(base);
  const delta = weekday - (day.getDay() || 7);
  day.setDate(day.getDate() + delta);
  // Hora plausible según turno (solo estético; no afecta a las métricas).
  day.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60), 0, 0);
  // No permitir fechas futuras.
  if (day > now) day.setDate(day.getDate() - 7);
  return day;
}

// Construye las métricas de una sesión a partir del perfil, la semana y las
// dimensiones del trabajador (turno y edad modulan el riesgo).
function buildSessionMetrics(profile, weekIdx, dims) {
  // Factor de tendencia centrado en la semana media; signo según perfil.
  const trend = profile.trendSign * (weekIdx - (WEEKS - 1) / 2) * 1.7;

  const shiftMod = SHIFT_RISK[dims.shift] || SHIFT_RISK.morning;
  const ageCbi = AGE_CBI[dims.ageBand] ?? 0;

  const pvt = clamp(profile.pvtBase + trend + shiftMod.pvt + noise(9), 2, 98);
  const stroop = clamp(profile.stroopBase + trend + noise(9), 2, 98);
  const cbi = clamp(profile.cbiBase + trend + ageCbi + noise(8), 2, 98);
  const sleepHours = clamp(profile.sleepBase + shiftMod.sleep + noise(1.1), 3.2, 9);

  const risk = clamp(
    pvt * W.pvt + stroop * W.stroop + cbi * W.cbi + sleepPenalty(sleepHours) * W.sleep,
    0,
    100,
  );

  return {
    risk_index: Math.round(risk),
    pvt_index: Math.round(pvt),
    stroop_index: Math.round(stroop),
    cbi_score: Math.round(cbi),
    sleep_hours: round1(sleepHours),
  };
}

async function ensureOrgAndCodes() {
  const organization = await prisma.organization.upsert({
    where: { slug: ORG.slug },
    create: {
      name: ORG.name,
      slug: ORG.slug,
      pilotRef: ORG.pilotRef,
      retentionUntil: ORG.retentionUntil,
    },
    update: {
      name: ORG.name,
      pilotRef: ORG.pilotRef,
      retentionUntil: ORG.retentionUntil,
    },
  });

  for (let i = 1; i <= ACCESS_CODE_COUNT; i += 1) {
    const codeHash = hashCode(buildAccessCode(i));
    const { department, shift, gender, ageBand, tenureBand } = dimensionsForIndex(i);
    const data = { orgId: organization.id, department, shift, gender, ageBand, tenureBand, revoked: false };
    await prisma.accessCode.upsert({
      where: { codeHash },
      create: { codeHash, ...data },
      update: data,
    });
  }

  const passwordHash = await bcrypt.hash(EMPLOYER_USER.password, BCRYPT_ROUNDS);
  await prisma.employerUser.upsert({
    where: { email: EMPLOYER_USER.email },
    create: {
      orgId: organization.id,
      email: EMPLOYER_USER.email,
      passwordHash,
      role: EMPLOYER_USER.role,
    },
    update: { orgId: organization.id, passwordHash, role: EMPLOYER_USER.role },
  });

  return organization;
}

async function main() {
  const organization = await ensureOrgAndCodes();

  // Reset: borra las sesiones previas de la organización (demo repetible).
  const deleted = await prisma.session.deleteMany({ where: { orgId: organization.id } });

  const rows = [];
  let highRiskCount = 0;

  for (let i = 1; i <= ACCESS_CODE_COUNT; i += 1) {
    if (i === RESERVED_LIVE_CODE) continue; // A050 limpio para la demo en vivo

    const dims = dimensionsForIndex(i);
    const profile = baseProfileForDept(dims.department);
    const codeHash = hashCode(buildAccessCode(i));

    for (let week = 0; week < WEEKS; week += 1) {
      const sessionsThisWeek =
        SESSIONS_PER_WEEK_MIN +
        Math.floor(Math.random() * (SESSIONS_PER_WEEK_MAX - SESSIONS_PER_WEEK_MIN + 1));

      for (let s = 0; s < sessionsThisWeek; s += 1) {
        const m = buildSessionMetrics(profile, week, dims);
        if (m.risk_index >= 60) highRiskCount += 1;

        rows.push({
          orgId: organization.id,
          codeHash,
          department: dims.department,
          shift: dims.shift,
          gender: dims.gender,
          ageBand: dims.ageBand,
          tenureBand: dims.tenureBand,
          takenAt: dateInWeek(week),
          riskIndexEnc: encryptNumber(m.risk_index),
          pvtIndexEnc: encryptNumber(m.pvt_index),
          stroopIndexEnc: encryptNumber(m.stroop_index),
          cbiScoreEnc: encryptNumber(m.cbi_score),
          sleepHoursEnc: encryptNumber(m.sleep_hours),
        });
      }
    }
  }

  // Inserción por lotes (rápida sobre conexiones remotas como Neon).
  const BATCH = 200;
  for (let i = 0; i < rows.length; i += BATCH) {
    await prisma.session.createMany({ data: rows.slice(i, i + BATCH) });
  }

  console.log('--- PulsePath seed DEMO (piloto Barcelona) ---');
  console.log(`Organización: ${organization.name} (${organization.slug})`);
  console.log(`Sesiones previas borradas: ${deleted.count}`);
  console.log(`Sesiones generadas: ${rows.length}`);
  console.log(`  · de las cuales en riesgo alto (≥60): ${highRiskCount}`);
  console.log(`Semanas de historial: ${WEEKS}`);
  console.log('Departamentos y turnos:');
  console.log('  · atencion_ciudadana (A001–A018 mañana, A019–A025 tarde) → sano, mejora');
  console.log('  · informatica (A026–A037 tarde, A038–A049 noche) → riesgo alto por burnout, empeora');
  console.log('Dimensiones añadidas: género (male/female), edad (u30/30_45/45_60/o60), antigüedad (u2/2_5/5_10/o10)');
  console.log('  · El turno de NOCHE es el de mayor riesgo (fatiga + déficit de sueño)');
  console.log(`Código limpio para demo en vivo: ${buildAccessCode(RESERVED_LIVE_CODE)}`);
  console.log(`Login RRHH: ${EMPLOYER_USER.email} / ${EMPLOYER_USER.password}`);
  console.log('Seed DEMO completado.');
}

main()
  .catch((error) => {
    console.error('Error en seed-demo:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
