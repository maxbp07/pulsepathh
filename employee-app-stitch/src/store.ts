import { create } from 'zustand';
import type { CheckinContext, FriResult, PvtMetrics } from './lib/types';

/**
 * Estado temporal del check-in en curso (context → kss → pvt → resultado).
 * No se persiste: se consume al guardar la sesión y se resetea.
 */
interface CheckinState {
  context: CheckinContext | null;
  kss: number | null;
  pvt: PvtMetrics | null;
  fri: FriResult | null;
  setContext: (c: CheckinContext) => void;
  setKss: (kss: number) => void;
  setPvt: (pvt: PvtMetrics, fri: FriResult) => void;
  reset: () => void;
}

export const useCheckin = create<CheckinState>((set) => ({
  context: null,
  kss: null,
  pvt: null,
  fri: null,
  setContext: (context) => set({ context }),
  setKss: (kss) => set({ kss }),
  setPvt: (pvt, fri) => set({ pvt, fri }),
  reset: () => set({ context: null, kss: null, pvt: null, fri: null }),
}));
