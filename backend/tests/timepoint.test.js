import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { validateTimepointEligibility } from '../src/lib/validators/studyValidators.js';

describe('validateTimepointEligibility', () => {
  const day0 = new Date('2026-07-01T00:00:00.000Z');

  it('allows D0 on study day 0', () => {
    const r = validateTimepointEligibility('D0', day0, '2026-07-01');
    assert.equal(r.ok, true);
  });

  it('blocks D7 before day 7', () => {
    const r = validateTimepointEligibility('D7', day0, '2026-07-03');
    assert.equal(r.ok, false);
    assert.equal(r.error, 'timepoint_not_allowed');
  });

  it('allows D7 on day 7+', () => {
    const r = validateTimepointEligibility('D7', day0, '2026-07-08');
    assert.equal(r.ok, true);
  });

  it('allows D14 on day 14+', () => {
    const r = validateTimepointEligibility('D14', day0, '2026-07-15');
    assert.equal(r.ok, true);
  });
});
