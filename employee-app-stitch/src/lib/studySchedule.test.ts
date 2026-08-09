import { describe, expect, it } from 'vitest';
import { studyDay, timepointForDay, isTimepointComplete } from './studySchedule';

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
});
