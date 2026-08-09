import { describe, expect, it } from 'vitest';
import { scoreDassFull, dassSubscaleSeverity } from './dass';

describe('dass', () => {
  it('scores all three subscales', () => {
    const answers = Array(21).fill(1);
    const s = scoreDassFull(answers);
    expect(s.depression).toBe(7);
    expect(s.anxiety).toBe(7);
    expect(s.stress).toBe(7);
    expect(s.total).toBe(21);
  });

  it('maps stress severity', () => {
    expect(dassSubscaleSeverity('stress', 10)).toBe('normal');
    expect(dassSubscaleSeverity('stress', 20)).toBe('moderate');
  });
});
