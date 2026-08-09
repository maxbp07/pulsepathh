import { describe, expect, it } from 'vitest';
import {
  localDateISO,
  studyDay,
  timepointForDay,
  isTimepointComplete,
} from './studySchedule';

describe('studySchedule', () => {
  it('computes study day from day0', () => {
    expect(studyDay('2026-07-01', '2026-07-08')).toBe(7);
  });

  it('timepointForDay boundaries', () => {
    expect(timepointForDay(0)).toBe('D0');
    expect(timepointForDay(7)).toBe('D7');
    expect(timepointForDay(14)).toBe('D14');
  });

  it('isTimepointComplete checks all instruments', () => {
    const done = new Set(['DASS21_FULL:D0', 'GAD7:D0', 'CBI:D0']);
    expect(isTimepointComplete(done, 'D0')).toBe(true);
    expect(isTimepointComplete(new Set(), 'D0')).toBe(false);
  });

  it('localDateISO uses device calendar fields, not UTC', () => {
    // 23:30 en Madrid (UTC+2 en verano) = 21:30Z → UTC sería aún el mismo día;
    // forzamos un instante que en UTC ya es el día siguiente pero en offset +2 sigue siendo el anterior.
    // 2026-08-08 23:30 en America/Los_Angeles (UTC-7) ≈ 2026-08-09T06:30:00.000Z
    const lateLocal = new Date(2026, 7, 8, 23, 30, 0); // month 7 = August, local constructor
    expect(localDateISO(lateLocal)).toBe('2026-08-08');
    // Contraste: toISOString en husos al oeste de UTC puede caer en el día siguiente.
    // En este Date local (constructor sin Z), getDate() es 8; ISO UTC puede ser 8 u 9 según TZ del runner.
    expect(localDateISO(lateLocal)).not.toMatch(/T/);
    expect(localDateISO(lateLocal)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('localDateISO does not advance past midnight when UTC already did', () => {
    // Construye un Date cuya representación UTC es 00:30 del día D+1,
    // pero cuyos getters locales (getFullYear/getMonth/getDate) son el día D
    // solo si el offset local es positivo. Usamos getters locales directamente.
    const d = new Date();
    d.setFullYear(2026, 7, 8); // 8 ago 2026 local
    d.setHours(23, 45, 0, 0);
    expect(localDateISO(d)).toBe(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
    // Garantía del bugfix: nunca usar toISOString().slice(0,10) para dateLocal.
    const utcDay = d.toISOString().slice(0, 10);
    const localDay = localDateISO(d);
    // En Europe/Madrid (UTC+1/+2) a las 23:45 local, UTC aún es el mismo día civil.
    // En husos UTC-N, utcDay puede ser D+1. localDay debe seguir el calendario local.
    expect(localDay).toBe('2026-08-08');
    if (utcDay !== localDay) {
      expect(localDay).toBe('2026-08-08');
    }
  });
});
