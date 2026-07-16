import { calculatePvtMetrics } from '../src/lib/pvt';
import { calculateFri } from '../src/lib/fri';
import { createPvtBaState, updatePvtBa, classifyByLpfs, type PvtBaState } from '../src/lib/pvtBa';

function assert(cond: string, ok: boolean) {
  console.log(`${ok ? '✅' : '❌'} ${cond}`);
  if (!ok) process.exitCode = 1;
}

// Simula un test PVT-BA dada una secuencia de respuestas (true = lapse/false-start).
// Devuelve el estado final y cuántas respuestas tardó en decidir.
function simulatePvtBa(responses: boolean[]): { state: PvtBaState; decidedAt: number | null } {
  let s = createPvtBaState();
  let decidedAt: number | null = null;
  for (let i = 0; i < responses.length; i++) {
    const elapsedSec = 20 + i * 3; // ~3s por respuesta
    s = updatePvtBa(s, responses[i], elapsedSec);
    if (s.stopped && decidedAt === null) {
      decidedAt = i + 1;
      break;
    }
  }
  return { state: s, decidedAt };
}

// --- Escenario A: usuario ALERTA (todas respuestas limpias, sin lapses/FS) ---
const A = simulatePvtBa(Array.from({ length: 60 }, () => false));
console.log('\nAlert user:', JSON.stringify({ category: A.state.category, lpfs: A.state.lpfs, decidedAt: A.decidedAt, stopReason: A.state.stopReason, pHigh: A.state.pHigh.toFixed(3) }));
assert('Alert → HIGH performance', A.state.category === 'HIGH');
assert('Alert → paró antes de las 60 respuestas (adaptativo)', A.decidedAt !== null && A.decidedAt < 60);

// --- Escenario B: usuario FATIGADO (muchos lapses) ---
const B = simulatePvtBa([true, true, false, true, true, false, true, true, true, true, true, true, true, true, true, true, true]);
console.log('\nFatigued user:', JSON.stringify({ category: B.state.category, lpfs: B.state.lpfs, decidedAt: B.decidedAt, stopReason: B.state.stopReason }));
assert('Fatigued → LOW performance', B.state.category === 'LOW');
assert('Fatigued → paró pronto (pocos responses)', B.decidedAt !== null && (B.decidedAt as number) <= 17);

// --- Escenario C: mixto → MEDIUM ---
const C = simulatePvtBa([false, false, false, true, false, false, true, false, true, false, true, false, true, true, false, true, true, true, true, true]);
console.log('\nMixed user:', JSON.stringify({ category: C.state.category, lpfs: C.state.lpfs, decidedAt: C.decidedAt }));
assert('Mixed → MEDIUM o LOW (no HIGH, tiene >6 LpFS)', C.state.category !== 'HIGH');

// --- classifyByLpfs coherente con umbrales ---
assert('classifyByLpfs(3)=HIGH', classifyByLpfs(3) === 'HIGH');
assert('classifyByLpfs(6)=HIGH', classifyByLpfs(6) === 'HIGH');
assert('classifyByLpfs(10)=MEDIUM', classifyByLpfs(10) === 'MEDIUM');
assert('classifyByLpfs(20)=LOW', classifyByLpfs(20) === 'LOW');

// --- FRI sigue coherente con la categoría ---
const fresh = calculatePvtMetrics(Array.from({ length: 30 }, () => 240), 0, 180000);
const friFresh = calculateFri({ ...fresh, category: 'HIGH', lpfs: 2, stoppedEarly: true }, 2);
const fatigued = calculatePvtMetrics([450, 500, 600, 700, 800, 480, 520, 620, 580, 900], 3, 75000);
const friFat = calculateFri({ ...fatigued, category: 'LOW', lpfs: 18, stoppedEarly: true }, 8);
console.log('\nFRI fresh:', friFresh.fri, friFresh.band, '| FRI fatigued:', friFat.fri, friFat.band);
assert('FRI fresco bajo', friFresh.fri < 15);
assert('FRI fatigado alto', friFat.fri > 60);

console.log('\nSmoke test PVT-BA + FRI completo.');
